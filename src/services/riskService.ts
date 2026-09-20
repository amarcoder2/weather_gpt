import { RiskAssessment } from '../types/risk';
import { MOCK_RISK_ASSESSMENTS } from '../data/mockRisk';
import { apiClient } from './apiClient';

export interface IRiskService {
  getRiskAssessment(locationId: string): Promise<RiskAssessment>;
}

class RiskService implements IRiskService {
  async getRiskAssessment(locationId: string): Promise<RiskAssessment> {
    const normalized = locationId.toLowerCase();
    try {
      const res = await apiClient.get<Record<string, unknown>>(`/risk/${encodeURIComponent(normalized)}`);
      if (res.success && res.data) {
        const d = res.data;
        const fallback = MOCK_RISK_ASSESSMENTS[normalized] || MOCK_RISK_ASSESSMENTS['kolkata'];
        const levelMap: Record<string, RiskAssessment['overallLevel']> = {
          LOW: 'Low',
          MODERATE: 'Moderate',
          ELEVATED: 'Moderate',
          HIGH: 'High',
          EXTREME: 'Extreme',
        };
        const rawLvl = ((d.riskLevel as string) || '').toUpperCase();
        return {
          locationId: normalized,
          locationName: (d.locationName as string) || fallback.locationName,
          overallScore: Number(
            d.riskScore !== undefined
              ? d.riskScore
              : d.overallScore !== undefined
              ? d.overallScore
              : fallback.overallScore
          ),
          overallLevel: levelMap[rawLvl] || fallback.overallLevel,
          assessmentDate: (d.calculatedAt as string) || (d.assessmentDate as string) || fallback.assessmentDate,
          hazards: Array.isArray(d.hazards) ? d.hazards : fallback.hazards,
          factors: Array.isArray(d.factors) ? d.factors : fallback.factors,
          explanation: (d.explanation as string) || fallback.explanation,
          recommendations: Array.isArray(d.recommendations) ? d.recommendations : fallback.recommendations,
          isDemoData: true,
        };
      }
    } catch {
      // Fallback
    }

    const data = MOCK_RISK_ASSESSMENTS[normalized] || MOCK_RISK_ASSESSMENTS['kolkata'];
    return { ...data, isDemoData: true };
  }
}

export const riskService = new RiskService();
