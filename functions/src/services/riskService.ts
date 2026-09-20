// ==============================================================================
// WEATHERGPT RISK ENGINE v1 (Section 18 & 19)
// ==============================================================================

import {
  RiskAssessmentRecord,
  RiskFactorContribution,
  HazardRiskBreakdown,
  WeatherObservation,
} from '../types';
import { RISK_LEVELS, RISK_THRESHOLDS, RiskLevel, HAZARD_TYPES } from '../constants';
import { weatherProvider } from '../providers/weather/MockWeatherProvider';
import { locationRepository } from '../repositories/locationRepository';
import { alertRepository } from '../repositories/alertRepository';
import { db, isFirestoreEnabled } from '../config';
import { logger } from '../logging/logger';

export class RiskService {
  readonly modelVersion = 'rules-v1';
  private collection = db.collection('riskAssessments');
  private memoryAssessments = new Map<string, RiskAssessmentRecord>();

  /**
   * Evaluates numerical score into standardized categorical Risk Level
   */
  classifyRiskScore(score: number): RiskLevel {
    if (score <= RISK_THRESHOLDS.LOW_MAX) return RISK_LEVELS.LOW;
    if (score <= RISK_THRESHOLDS.MODERATE_MAX) return RISK_LEVELS.MODERATE;
    if (score <= RISK_THRESHOLDS.ELEVATED_MAX) return RISK_LEVELS.ELEVATED;
    if (score <= RISK_THRESHOLDS.HIGH_MAX) return RISK_LEVELS.HIGH;
    return RISK_LEVELS.EXTREME;
  }

  /**
   * Multi-hazard risk algorithm evaluating real atmospheric indicators:
   * 1. Rainfall intensity & probability (max +35 pts)
   * 2. Wind speed & gust factors (max +25 pts)
   * 3. Thermal extremes / Heat index (max +20 pts)
   * 4. Active warning impact (max +20 pts)
   */
  async calculateLocationRisk(locationId: string): Promise<RiskAssessmentRecord> {
    const loc = await locationRepository.getById(locationId);
    const locationName = loc ? loc.name : locationId;
    const state = loc ? loc.state : 'India';

    const obs: WeatherObservation = await weatherProvider.getCurrentWeather(locationId);
    const { alerts } = await alertRepository.listAlerts({ location: locationId });
    const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');

    const factors: RiskFactorContribution[] = [];
    let cumulativeScore = 0;

    // Factor 1: Precipitation & Hydrological Exposure
    let rainContribution = 0;
    if (obs.precipitation > 20 || obs.precipitationProbability > 80) {
      rainContribution = Math.min(35, Math.round(obs.precipitation * 1.5 + (obs.precipitationProbability * 0.15)));
      factors.push({
        name: 'Precipitation Volume & Probability',
        value: `${obs.precipitation} mm/h (${obs.precipitationProbability}% prob)`,
        contribution: rainContribution,
        level: rainContribution > 25 ? 'CRITICAL' : rainContribution > 15 ? 'HIGH' : 'MEDIUM',
        description: 'Atmospheric moisture and convective rain rate elevate localized urban inundation and river basin runoff.',
      });
    } else {
      rainContribution = 5;
      factors.push({
        name: 'Precipitation',
        value: `${obs.precipitation} mm/h`,
        contribution: 5,
        level: 'LOW',
        description: 'Dry or light trace precipitation; baseline hydrological stability.',
      });
    }
    cumulativeScore += rainContribution;

    // Factor 2: Aerodynamic Wind Load
    let windContribution = 0;
    if (obs.windSpeed > 35 || (obs.windGust && obs.windGust > 50)) {
      windContribution = Math.min(25, Math.round(obs.windSpeed * 0.45));
      factors.push({
        name: 'Wind Shear & Gust Velocity',
        value: `${obs.windSpeed} km/h (Gusts: ${obs.windGust || obs.windSpeed} km/h)`,
        contribution: windContribution,
        level: windContribution > 18 ? 'HIGH' : 'MEDIUM',
        description: 'High surface wind velocities pose structural, marine, and power grid hazards.',
      });
    } else {
      windContribution = 3;
      factors.push({
        name: 'Wind Velocity',
        value: `${obs.windSpeed} km/h`,
        contribution: 3,
        level: 'LOW',
        description: 'Normal aerological range below warning thresholds.',
      });
    }
    cumulativeScore += windContribution;

    // Factor 3: Thermal Stress / Heat Index
    let heatContribution = 0;
    if (obs.temperature >= 42) {
      heatContribution = 20;
      factors.push({
        name: 'Extreme Ambient Temperature',
        value: `${obs.temperature}°C (Feels like: ${obs.feelsLike}°C)`,
        contribution: heatContribution,
        level: 'CRITICAL',
        description: 'Severe thermal stress crossing human physiological safety limits.',
      });
    } else if (obs.temperature >= 38) {
      heatContribution = 12;
      factors.push({
        name: 'Elevated Heatwave Potential',
        value: `${obs.temperature}°C`,
        contribution: heatContribution,
        level: 'HIGH',
        description: 'High solar exposure requiring community hydration and cooling safeguards.',
      });
    } else {
      heatContribution = 2;
    }
    cumulativeScore += heatContribution;

    // Factor 4: Active Emergency Warning Modifiers
    let warningContribution = 0;
    if (activeAlerts.length > 0) {
      const severeAlert = activeAlerts.find((a) => a.severity === 'SEVERE');
      const warningAlert = activeAlerts.find((a) => a.severity === 'WARNING');

      if (severeAlert) {
        warningContribution = 20;
      } else if (warningAlert) {
        warningContribution = 12;
      } else {
        warningContribution = 6;
      }

      factors.push({
        name: 'Active IMD Emergency Warning',
        value: `${activeAlerts.length} Active Bulletin(s)`,
        contribution: warningContribution,
        level: warningContribution >= 18 ? 'CRITICAL' : 'HIGH',
        description: `Official meteorological warnings are in effect: ${activeAlerts.map((a) => a.title).join('; ')}.`,
      });
    }
    cumulativeScore += warningContribution;

    // Location specific baseline adjustments
    if (loc?.region === 'Islands' || loc?.id === 'bhubaneswar' || loc?.id === 'mumbai') {
      cumulativeScore += 8; // Coastal vulnerability baseline
    }

    const finalScore = Math.min(100, Math.max(0, cumulativeScore));
    const riskLevel = this.classifyRiskScore(finalScore);

    const hazards: HazardRiskBreakdown[] = [
      {
        hazard: HAZARD_TYPES.CYCLONE,
        score: obs.conditionCode.includes('cyclon') ? 85 : 15,
        level: obs.conditionCode.includes('cyclon') ? RISK_LEVELS.EXTREME : RISK_LEVELS.LOW,
        trend: 'STABLE',
        summary: 'Maritime cyclogenesis tracking telemetry.',
      },
      {
        hazard: HAZARD_TYPES.FLOOD,
        score: rainContribution > 20 ? 74 : 20,
        level: rainContribution > 20 ? RISK_LEVELS.HIGH : RISK_LEVELS.MODERATE,
        trend: rainContribution > 20 ? 'INCREASING' : 'STABLE',
        summary: 'Catchment inflow and soil saturation metrics.',
      },
      {
        hazard: HAZARD_TYPES.HEATWAVE,
        score: heatContribution > 10 ? 82 : 10,
        level: heatContribution > 10 ? RISK_LEVELS.EXTREME : RISK_LEVELS.LOW,
        trend: 'STABLE',
        summary: 'Daytime surface insolation and wet-bulb temperature.',
      },
    ];

    const recommendations: string[] = [];
    if (riskLevel === RISK_LEVELS.EXTREME || riskLevel === RISK_LEVELS.HIGH) {
      recommendations.push('Mobilize District Emergency Operations Centre (DEOC) protocols.');
      recommendations.push('Issue targeted automated SMS/Broadcast alerts to low-lying settlements.');
      recommendations.push('Prepare designated shelters with potable water and backup generators.');
    } else if (riskLevel === RISK_LEVELS.ELEVATED) {
      recommendations.push('Maintain active watch on regional doppler radar loops.');
      recommendations.push('Inspect stormwater drainage bottlenecks and power transmission clearance.');
    } else {
      recommendations.push('Standard meteorological monitoring and advisory distribution.');
    }

    const assessment: RiskAssessmentRecord = {
      id: `risk_${locationId}_${Date.now()}`,
      locationId,
      locationName,
      state,
      riskScore: finalScore,
      riskLevel,
      calculatedAt: new Date().toISOString(),
      modelVersion: this.modelVersion,
      factors,
      hazards,
      explanation: `Multi-hazard algorithmic evaluation for ${locationName} indicates an aggregate risk score of ${finalScore}/100 (${riskLevel}). Primary driving factor: ${factors[0]?.name || 'Baseline parameters'}. Note: This assessment is computed by the WeatherGPT Rule Engine v1 and provides operational decision guidance.`,
      recommendations,
      isDemoData: true,
    };

    this.memoryAssessments.set(locationId, assessment);
    if (isFirestoreEnabled()) {
      try {
        await this.collection.doc(locationId).set(assessment);
      } catch {
        logger.debug('Firestore write fallback in RiskService');
      }
    }

    return assessment;
  }

  async getAssessment(locationId: string): Promise<RiskAssessmentRecord> {
    const existing = this.memoryAssessments.get(locationId);
    if (existing) {
      return existing;
    }
    return this.calculateLocationRisk(locationId);
  }

  async getAllAssessments(): Promise<RiskAssessmentRecord[]> {
    const locations = await locationRepository.getAll();
    const assessments: RiskAssessmentRecord[] = [];

    for (const loc of locations) {
      const a = await this.getAssessment(loc.id);
      assessments.push(a);
    }

    // Sort by riskScore descending (highest risk first)
    assessments.sort((a, b) => b.riskScore - a.riskScore);
    return assessments;
  }
}

export const riskService = new RiskService();
