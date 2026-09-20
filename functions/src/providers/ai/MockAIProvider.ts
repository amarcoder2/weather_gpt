// ==============================================================================
// DETERMINISTIC MOCK AI PROVIDER (Section 20 & 61)
// ==============================================================================

import { IAIProvider, AIResponse } from './IAIProvider';
import { ChatContextPayload } from '../../types';

export class MockAIProvider implements IAIProvider {
  readonly providerName = 'WeatherGPT-Deterministic-Reasoning-v1';

  async generateResponse(prompt: string, context?: ChatContextPayload): Promise<AIResponse> {
    const p = prompt.toLowerCase();
    const loc = context?.locationName || 'your current region';
    const temp = context?.weather?.temperature ? `${context.weather.temperature}°C` : 'current seasonal temperatures';
    const risk = context?.riskLevel || 'LOW';

    let text = '';
    let suggestedPrompts = [
      'What are the flood warnings for this week?',
      'Check current IMD radar reflectivity',
      'Explain heatwave precautions',
    ];

    if (p.includes('rain') || p.includes('monsoon') || p.includes('flood')) {
      text = `🌧️ **Precipitation & Inundation Assessment for ${loc}**:\n\nBased on localized meteorological radar and hydrological data, current atmospheric moisture levels indicate active convective cloud formations. With a prevailing risk level of **${risk}**, local low-lying catchments should monitor drainage clearance. Ensure emergency kits are stocked and follow IMD district bulletins.`;
      suggestedPrompts = [
        'Show 24-hour rainfall forecast',
        'Are there active flood alerts nearby?',
        'What should I do during flash flooding?',
      ];
    } else if (p.includes('cyclone') || p.includes('wind') || p.includes('storm')) {
      text = `🌪️ **Severe Weather & Cyclonic Intelligence for ${loc}**:\n\nCoastal and inland tracking telemetry indicates surface wind patterns with gusts influenced by maritime pressure gradients. NDMA cyclone preparedness advisories recommend inspecting roof fixtures, securing outdoor loose items, and keeping battery-powered communication devices primed.`;
      suggestedPrompts = [
        'What is the storm surge forecast?',
        'Where are designated cyclone shelters?',
        'What is the current wind speed?',
      ];
    } else if (p.includes('heat') || p.includes('temperature') || p.includes('sun')) {
      text = `☀️ **Thermal Stress & Heatwave Bulletin for ${loc}**:\n\nAmbient temperature is recorded at **${temp}**. Under National Disaster Management Authority (NDMA) guidelines, residents should avoid prolonged direct solar exposure between 12:00 PM and 3:30 PM, maintain hydration with ORS/water, and ensure adequate shade for vulnerable populations and livestock.`;
      suggestedPrompts = [
        'Check UV index for today',
        'When will temperatures peak this week?',
        'Symptoms of heat exhaustion vs heat stroke',
      ];
    } else {
      text = `🛰️ **WeatherGPT Intelligence Report for ${loc}**:\n\nAtmospheric conditions are currently evaluated at **${temp}** with an overall risk classification of **${risk}**.\n\nKey Observations:\n- Weather Pattern: ${context?.weather?.condition || 'Normal seasonal stability'}\n- Active Warning Count: ${context?.activeAlerts?.length || 0} alerts\n\nHow else can I assist your operational weather preparedness or emergency planning today?`;
    }

    return {
      text,
      suggestedPrompts,
      modelUsed: this.providerName,
    };
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }
}

export const aiProvider = new MockAIProvider();
