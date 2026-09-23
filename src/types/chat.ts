import { WeatherData } from './weather';
import { DailyForecast } from './forecast';
import { WeatherAlert } from './alert';

export interface ChatAdvisoryData {
  targetGroup: string; // e.g. "Farmers", "Fishermen", "Urban Commuters", "Disaster Response Teams"
  priority: 'Routine' | 'Urgent' | 'Critical';
  recommendations: string[];
  safeWindow: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  cardType?: 'weather' | 'forecast' | 'alert' | 'advisory';
  cardData?: {
    weather?: WeatherData;
    forecast?: DailyForecast[];
    alert?: WeatherAlert;
    advisory?: ChatAdvisoryData;
  };
  sources?: string[];
  suggestedFollowups?: string[];
  resolvedLocation?: import('./location').LocationInfo;
  locationSource?: 'explicit_query' | 'conversation_context' | 'selected_location' | 'current_location';
}

export interface ChatPromptSuggestion {
  id: string;
  label: string;
  query: string;
  category: 'general' | 'forecast' | 'disaster' | 'agriculture' | 'risk';
}
