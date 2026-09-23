import { ChatMessage, ChatPromptSuggestion } from '../types/chat';
import { weatherService } from './weatherService';
import { forecastService } from './forecastService';
import { disasterService } from './disasterService';
import { riskService } from './riskService';
import { apiClient } from './apiClient';

export const CHAT_SUGGESTIONS: ChatPromptSuggestion[] = [
  {
    id: 'sug-1',
    label: 'Will it rain tomorrow?',
    query: 'Will it rain tomorrow in my area?',
    category: 'forecast',
  },
  {
    id: 'sug-2',
    label: 'Is there a flood risk in my area?',
    query: 'Is there any flood or waterlogging risk in my location right now?',
    category: 'risk',
  },
  {
    id: 'sug-3',
    label: 'Should farmers expect heavy rain this week?',
    query: 'What is the agricultural advisory for farmers regarding rainfall and pest hazards this week?',
    category: 'agriculture',
  },
  {
    id: 'sug-4',
    label: 'Explain today’s weather simply',
    query: 'Explain today’s weather conditions in simple, non-technical language.',
    category: 'general',
  },
  {
    id: 'sug-5',
    label: 'Is there any severe weather warning nearby?',
    query: 'Are there any active cyclone or severe thunderstorm warnings issued by IMD for my state?',
    category: 'disaster',
  },
  {
    id: 'sug-6',
    label: 'How did Cyclone Amphan compare to recent storms?',
    query: 'Provide historical comparison between Cyclone Amphan (2020) and recent weather systems.',
    category: 'disaster',
  },
];

import { LocationInfo } from '../types/location';
import { resolveChatLocation, ChatLocationContext } from './chatLocationService';
import { locationService } from './locationService';
import { DEFAULT_LOCATIONS } from '../config/constants';

export interface ChatContextOptions {
  activeLocation?: LocationInfo;
  activeLocationId?: string;
  conversationLocation?: LocationInfo | null;
  currentLocation?: LocationInfo | null;
  language?: string;
}

export interface IAIService {
  askWeatherGPT(query: string, locationOrContext?: string | ChatContextOptions, language?: string): Promise<ChatMessage>;
  getInitialGreeting(locationOrId?: string | LocationInfo, language?: string): Promise<ChatMessage>;
}

class MockAIService implements IAIService {
  async getInitialGreeting(locationOrId?: string | LocationInfo, _language?: string): Promise<ChatMessage> {
    let loc: LocationInfo | undefined;
    if (typeof locationOrId === 'object' && locationOrId !== null) {
      loc = locationOrId;
    } else if (typeof locationOrId === 'string' && locationOrId.trim()) {
      const norm = locationOrId.toLowerCase().trim();
      loc = await locationService.getLocationById(norm);
      if (!loc) {
        loc = DEFAULT_LOCATIONS.find((l) => l.id.toLowerCase() === norm);
      }
    }
    if (!loc) {
      loc = DEFAULT_LOCATIONS[0];
    }

    const weather = await weatherService.getCurrentWeather(loc);
    return {
      id: 'msg-init-0',
      sender: 'assistant',
      text: `Namaste! I am **WeatherGPT**, your meteorological intelligence and disaster-readiness assistant, powered by Ministry of Earth Sciences (MoES) and India Meteorological Department (IMD) frameworks with live numerical weather prediction.\n\nCurrently monitoring **${weather.locationName}** (${weather.temperature}°C, ${weather.condition}). How can I assist you with forecasts, risk analysis, or emergency advisories today?`,
      timestamp: 'Just now',
      cardType: 'weather',
      cardData: {
        weather,
      },
      resolvedLocation: loc,
      locationSource: 'selected_location',
      sources: ['Open-Meteo Surface NWP Telemetry', 'INSAT-3DR Satellite Analysis Models', 'Regional Weather Mesh'],
      suggestedFollowups: [
        'Will it rain tomorrow?',
        'What is our flood risk score?',
        'Advisory for outdoor workers',
      ],
    };
  }

  async askWeatherGPT(
    query: string,
    locationOrContext?: string | ChatContextOptions,
    language?: string
  ): Promise<ChatMessage> {
    let context: ChatLocationContext = {};
    let lang = language;

    if (typeof locationOrContext === 'object' && locationOrContext !== null) {
      context = {
        conversationLocation: locationOrContext.conversationLocation,
        selectedLocation: locationOrContext.activeLocation,
        currentLocation: locationOrContext.currentLocation,
      };
      lang = locationOrContext.language || language;
    } else if (typeof locationOrContext === 'string' && locationOrContext.trim()) {
      const normId = locationOrContext.trim().toLowerCase();
      const def = DEFAULT_LOCATIONS.find((l) => l.id.toLowerCase() === normId);
      if (def) {
        context.selectedLocation = def;
      }
    }

    // Phase 5: Resolve chat location using nationwide directory and strict priority chain
    const resolution = await resolveChatLocation(query, context);

    // Phase 10: DO NOT silently fall back to Kolkata when explicit location cannot be found
    if (resolution.status === 'NOT_FOUND') {
      const notFoundName = resolution.notFoundTerm || 'that location';
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `I couldn't find **"${notFoundName}"** in the Indian location database.\n\nPlease verify the spelling, or specify the city and state (e.g. *"Bhubaneswar, Odisha"* or *"Mumbai, Maharashtra"*).`,
        timestamp: 'Just now',
        sources: ['WeatherGPT Indian Location Directory (GeoNames India CC BY 4.0)'],
        suggestedFollowups: [
          'What is the weather of Bhubaneswar now?',
          'What is the weather in Mumbai?',
          'What is the weather in Delhi?',
        ],
      };
    }

    const targetLocation = resolution.location || DEFAULT_LOCATIONS[0];

    try {
      const res = await apiClient.post<{
        userMessage: { id: string; content: string; timestamp: string };
        assistantMessage: { id: string; content: string; timestamp: string; suggestedPrompts?: string[]; modelUsed?: string };
      }>('/chat', {
        message: query,
        locationId: targetLocation.id,
        coordinates: { latitude: targetLocation.lat, longitude: targetLocation.lon },
        language: lang,
      });

      if (res.success && res.data?.assistantMessage?.content) {
        const weather = await weatherService.getCurrentWeather(targetLocation);
        return {
          id: res.data.assistantMessage.id || `msg-${Date.now()}`,
          sender: 'assistant',
          text: res.data.assistantMessage.content,
          timestamp: 'Just now',
          cardType: 'weather',
          cardData: { weather },
          resolvedLocation: targetLocation,
          locationSource: resolution.source,
          sources: [
            res.data.assistantMessage.modelUsed || 'WeatherGPT Meteorological Reasoning Core',
            'Open-Meteo Real-Time NWP Telemetry',
            'INSAT-3DR Satellite Meteorological Feed',
          ],
          suggestedFollowups:
            res.data.assistantMessage.suggestedPrompts && res.data.assistantMessage.suggestedPrompts.length > 0
              ? res.data.assistantMessage.suggestedPrompts
              : [
                  'What are the flood warnings for this week?',
                  'Check current IMD radar reflectivity',
                  'Explain heatwave precautions',
                ],
        };
      }
    } catch {
      // Fallback to local meteorological reasoning below
    }

    // Simulate natural LLM processing latency for local reasoning core
    await new Promise((resolve) => setTimeout(resolve, 300));

    const q = query.toLowerCase();
    const weather = await weatherService.getCurrentWeather(targetLocation);
    const forecast = await forecastService.getForecast(targetLocation);
    const risk = await riskService.getRiskAssessment(targetLocation);
    const alerts = await disasterService.getActiveAlerts();

    // Phase 9: Consistency Verification
    if (
      weather.locationName.trim().toLowerCase() !== targetLocation.name.trim().toLowerCase() &&
      (Math.abs(weather.lat - targetLocation.lat) > 0.5 || Math.abs(weather.lon - targetLocation.lon) > 0.5)
    ) {
      throw new Error(`Location consistency mismatch: requested "${targetLocation.name}" but received telemetry for "${weather.locationName}".`);
    }

    // Intent 1: Rain or Tomorrow's weather
    if (q.includes('rain') || q.includes('tomorrow') || q.includes('shower') || q.includes('umbrella')) {
      const tomorrow = forecast.daily[1] || forecast.daily[0];
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `**Yes, significant rainfall is anticipated tomorrow in ${weather.locationName}.**\n\nAccording to IMD numerical prediction models, there is an **${tomorrow.rainProb}% probability of precipitation** with expected accumulations near **${tomorrow.rainfallMm} mm**. Convective instability will peak in the afternoon with gusty surface winds up to **${tomorrow.windMax} kmph**.\n\n**Advisory**: Carry rain protection, anticipate delayed urban transit, and avoid sheltering beneath weak trees during squalls.`,
        timestamp: 'Just now',
        cardType: 'forecast',
        cardData: {
          forecast: forecast.daily.slice(0, 3),
        },
        resolvedLocation: targetLocation,
        locationSource: resolution.source,
        sources: ['IMD Multi-Model Ensemble (MME)', 'WRF 3km Mesoscale Model', 'Global Forecast System (GFS)'],
        suggestedFollowups: [
          'What hours will rain be heaviest?',
          'Is waterlogging expected on main arterial roads?',
          '7-day forecast overview',
        ],
      };
    }

    // Intent 2: Flood / Waterlogging risk
    if (q.includes('flood') || q.includes('waterlog') || q.includes('inundat') || q.includes('drain')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `**Flood & Waterlogging Assessment for ${weather.locationName}:**\n\nThe current urban waterlogging risk score is **${risk.hazards.find((h) => h.category === 'flood')?.score || 74}/100 (HIGH)**.\n\n- **Ground Saturation:** Extremely high following recent rainfall pulses.\n- **Drainage Capacity:** Canal outfall lock-gates are subject to tidal obstruction.\n- **Vulnerable Localities:** Low-lying wards and basements face pooling of 0.2m to 0.4m during peak showers.`,
        timestamp: 'Just now',
        cardType: 'advisory',
        cardData: {
          advisory: {
            targetGroup: 'Urban Residents & Municipal Crews',
            priority: 'Urgent',
            recommendations: [
              'Do not navigate flooded roads where open manholes or submerged electric cables may exist.',
              'Move sensitive electrical appliances and vehicles to elevated parking levels.',
              'Municipal drainage pumps have been positioned at key stormwater outfalls.',
            ],
            safeWindow: 'Conditions expected to improve post 22:00 IST as tidal crest subsides.',
          },
        },
        resolvedLocation: targetLocation,
        locationSource: resolution.source,
        sources: ['Central Water Commission (CWC) River Gauges', 'State Disaster Management Authority (SDMA)'],
        suggestedFollowups: [
          'Show detailed risk factor breakdown',
          'Which emergency helpline numbers are active?',
        ],
      };
    }

    // Intent 3: Farmers / Agriculture
    if (q.includes('farmer') || q.includes('crop') || q.includes('agriculture') || q.includes('paddy') || q.includes('harvest')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `**Agrometeorological Advisory (Gramin Krishi Mausam Sewa):**\n\nFor agricultural blocks in and around **${weather.district}, ${weather.state}**:\n\n1. **Paddy & Kharif Crops**: Postpone foliar pesticide and fertilizer applications during the next 48 hours to avoid chemical wash-off from precipitation.\n2. **Drainage Clearance**: Clear water-choking debris from field bunds and drainage furrows to prevent water stagnation in vegetable and seedling nurseries.\n3. **Horticultural Support**: Stake banana, papaya, and young saplings against gusty convective winds (35-45 kmph).\n4. **Livestock**: Shelter cattle in roofed enclosures with dry bedding away from open metal tin sheds subject to lightning strikes.`,
        timestamp: 'Just now',
        cardType: 'advisory',
        cardData: {
          advisory: {
            targetGroup: 'Agronomists & Smallholder Farmers',
            priority: 'Urgent',
            recommendations: [
              'Suspend irrigation and spraying for 48 hours.',
              'Open drainage channels in pulses and oilseed fields.',
              'Ensure vaccinated livestock remain under masonry sheds during lightning.',
            ],
            safeWindow: 'Fieldwork window opens Wednesday morning under clearer skies.',
          },
        },
        resolvedLocation: targetLocation,
        locationSource: resolution.source,
        sources: ['IMD Agromet Advisory Service', 'ICAR Agricultural Research Extension'],
        suggestedFollowups: [
          'What is the 7-day soil moisture forecast?',
          'Is lightning protection active in my taluka?',
        ],
      };
    }

    // Intent 4: Alerts / Cyclone / Warning
    if (q.includes('alert') || q.includes('warning') || q.includes('cyclone') || q.includes('severe') || q.includes('storm')) {
      const topAlert = alerts[0];
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `**Active Disaster Bulletin:**\n\nThere is currently an active **${topAlert.severity.toUpperCase()} ALERT** for **${topAlert.location}**.\n\n**${topAlert.title}**\n${topAlert.headline}\n\n*Valid Until: ${topAlert.validUntil}*\n\nRecommended emergency protocols have been initiated by District Disaster Management Authorities.`,
        timestamp: 'Just now',
        cardType: 'alert',
        cardData: {
          alert: topAlert,
        },
        resolvedLocation: targetLocation,
        locationSource: resolution.source,
        sources: ['IMD Cyclone Warning Division', 'National Disaster Management Authority (NDMA)'],
        suggestedFollowups: [
          'Show recommended civilian actions',
          'View affected districts map',
          'Is public transit operational?',
        ],
      };
    }

    // Intent 5: Simple explanation
    if (q.includes('simple') || q.includes('explain') || q.includes('kid') || q.includes('easy')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `Here is today's weather in plain and simple terms for **${weather.locationName}**:\n\n- **How it feels:** It feels very muggy and sticky outside (**${weather.feelsLike}°C**), even though the actual thermometer says **${weather.temperature}°C**.\n- **The sky:** Heavy clouds are observed over ${weather.district}.\n- **The big message:** Expect sudden showers with rumbling thunder later in the day. Keep an umbrella in your bag and stay indoors if thunder starts roaring!\n- **Air Quality:** The air quality index is registered at **AQI ${weather.airQualityIndex}**.`,
        timestamp: 'Just now',
        cardType: 'weather',
        cardData: {
          weather,
        },
        resolvedLocation: targetLocation,
        locationSource: resolution.source,
        sources: [weather.stationName || `${weather.locationName} Surface Telemetry`, 'Open-Meteo Real-Time NWP Telemetry'],
        suggestedFollowups: [
          'Will it stay this hot tonight?',
          'What causes sticky humidity?',
        ],
      };
    }

    // Default conversational response (Intent 6)
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `Based on current meteorological telemetry for **${weather.locationName}**, the current temperature is **${weather.temperature}°C** with relative humidity at **${weather.humidity}%** and barometric pressure at **${weather.pressure} hPa**.\n\nRegarding your question: *"“${query}”"*\n\nOur integrated risk engine assesses overall hazard exposure at **${risk.overallScore}/100 (${risk.overallLevel.toUpperCase()})**. Monsoonal moisture influx remains the dominant synoptic feature driving local atmospheric dynamics. Please let me know if you would like localized hourly projections, farming advisories, or disaster evacuation routes.`,
      timestamp: 'Just now',
      cardType: 'weather',
      cardData: {
        weather,
      },
      resolvedLocation: targetLocation,
      locationSource: resolution.source,
      sources: ['Open-Meteo Numerical Met Prediction', 'Satellite Observational Analysis', 'WeatherGPT Meteorological Reasoning Engine'],
      suggestedFollowups: [
        'Will it rain tomorrow?',
        'Is there a flood risk in my area?',
        'Advisory for farmers',
      ],
    };
  }
}

export const aiService = new MockAIService();
