// ==============================================================================
// GEMINI AI PROVIDER WITH RESILIENT FALLBACK (SIH 2026 #26068)
// ==============================================================================

import { IAIProvider, AIResponse } from './IAIProvider';
import { MockAIProvider } from './MockAIProvider';
import { ChatContextPayload } from '../../types';
import { logger } from '../../logging/logger';
import '../../config';

export class GeminiAIProvider implements IAIProvider {
  readonly providerName = 'WeatherGPT-Gemini-Reasoning-v1';
  private mockFallback = new MockAIProvider();

  private getApiKey(): string | undefined {
    return process.env.GEMINI_API_KEY;
  }

  /**
   * Generates AI meteorological intelligence response.
   * If GEMINI_API_KEY is configured and service is reachable, calls Gemini 1.5 Flash;
   * otherwise transparently falls back to deterministic MockAIProvider.
   */
  async generateResponse(prompt: string, context?: ChatContextPayload): Promise<AIResponse> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      logger.debug('GEMINI_API_KEY not configured; using deterministic MockAIProvider', {
        service: 'GeminiAIProvider',
      });
      const fallbackResult = await this.mockFallback.generateResponse(prompt, context);
      return {
        ...fallbackResult,
        modelUsed: `${this.mockFallback.providerName} (Fallback)`,
      };
    }

    try {
      const locName = context?.locationName || 'India National Meteorological Grid';
      const weatherText = context?.weather
        ? `Temperature: ${context.weather.temperature}°C, Feels Like: ${context.weather.feelsLike}°C, Humidity: ${context.weather.humidity}%, Wind: ${context.weather.windSpeed} km/h, Condition: ${context.weather.condition}`
        : 'Telemetry: Standard seasonal readings';
      const riskText = context?.riskScore !== undefined
        ? `Risk Score: ${context.riskScore}/100, Operational Risk Level: ${context.riskLevel}`
        : 'Risk Level: Standard baseline monitoring';
      const alertsText = context?.activeAlerts && context.activeAlerts.length > 0
        ? context.activeAlerts.join(' | ')
        : 'No active emergency warnings in effect';

      const systemPrompt = `You are WeatherGPT, an authoritative conversational meteorological AI assistant for India (SIH 2026 Problem #26068, developed under Ministry of Earth Sciences and India Meteorological Department guidelines).

YOUR METEOROLOGICAL CONTEXT:
- Monitored Location: ${locName}
- Current Weather: ${weatherText}
- Risk Assessment: ${riskText}
- Active Alerts & Advisories: ${alertsText}

GUIDELINES:
1. Answer the user's meteorological question with scientific accuracy, empathy, and actionable preparedness guidance.
2. If hazardous conditions (cyclone, extreme rainfall, heatwave, flash flooding) are detected in context, provide concrete safety recommendations based on NDMA civil defense protocols.
3. Keep responses structured, concise, and easy to read on mobile and web displays.
4. If asked about data sources, reference IMD Doppler Radar, AWS networks, and INSAT-3DR meteorological satellite feeds.`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

      let response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${systemPrompt}\n\nUSER QUERY: ${prompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 800,
          },
        }),
        signal: AbortSignal.timeout(6000),
      });

      if ((response.status === 503 || response.status === 429) && !response.ok) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `${systemPrompt}\n\nUSER QUERY: ${prompt}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 800,
            },
          }),
          signal: AbortSignal.timeout(6000),
        });
      }

      if (!response.ok) {
        throw new Error(`Gemini API responded with HTTP status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error('Gemini API returned an empty completion');
      }

      // Generate contextually relevant follow-up prompts
      const suggestedPrompts = [
        `What is the 3-day rainfall outlook for ${locName}?`,
        'What precautions should outdoor workers take today?',
        'Are there active flood alerts in neighboring districts?',
      ];

      return {
        text: generatedText,
        suggestedPrompts,
        modelUsed: 'Google Gemini Flash (Live Context)',
      };
    } catch (err: unknown) {
      logger.warn('Gemini API request failed or timed out; activating deterministic MockAIProvider fallback', {
        service: 'GeminiAIProvider',
        metadata: {
          error: err instanceof Error ? err.message : String(err),
        },
      });

      const fallbackResult = await this.mockFallback.generateResponse(prompt, context);
      return {
        ...fallbackResult,
        modelUsed: `${this.mockFallback.providerName} (Fallback)`,
      };
    }
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }
}

export const aiProvider = new GeminiAIProvider();
