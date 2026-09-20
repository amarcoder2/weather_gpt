// ==============================================================================
// WEATHERGPT BACKEND TYPE DEFINITIONS (SIH 2026 #26068)
// ==============================================================================

import { Role, AlertSeverity, AlertStatus, HazardType, RiskLevel, DataFreshness, AuditAction } from '../constants';

// ------------------------------------------------------------------------------
// 1. API RESPONSE STANDARDS (Section 6)
// ------------------------------------------------------------------------------
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasNext: boolean;
  nextCursor?: string;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    requestId: string;
    timestamp: string;
    pagination?: PaginationMeta;
    [key: string]: unknown;
  };
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  field?: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
  requestId: string;
}

// ------------------------------------------------------------------------------
// 2. USER & AUTHENTICATION (Section 8, 9, 11)
// ------------------------------------------------------------------------------
export interface NotificationPreferences {
  severeWeather: boolean;
  heavyRain: boolean;
  cycloneAlert: boolean;
  floodWarning: boolean;
  heatwaveAlert: boolean;
  dailyForecastDigest: boolean;
}

export interface VoicePreferences {
  enabled: boolean;
  language: string;
  speed: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: Role;
  preferredLanguage: string;
  preferredLocationId?: string;
  savedLocationIds: string[];
  notificationPreferences: NotificationPreferences;
  voicePreferences: VoicePreferences;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED';
}

export interface AuthContext {
  uid: string;
  email: string;
  role: Role;
  displayName?: string;
}

// ------------------------------------------------------------------------------
// 3. LOCATION REGISTRY (Section 12)
// ------------------------------------------------------------------------------
export interface LocationRecord {
  id: string;
  name: string;
  city: string;
  district: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  pincode?: string;
  region: 'North' | 'South' | 'East' | 'West' | 'Central' | 'North-East' | 'Islands';
  stationCode?: string;
  elevationMeters?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------------------------
// 4. WEATHER & FORECAST (Section 13, 14, 46)
// ------------------------------------------------------------------------------
export interface WeatherObservation {
  id: string;
  locationId: string;
  locationName: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  observedAt: string;
  temperature: number;       // Celsius
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;          // %
  pressure: number;          // hPa
  windSpeed: number;         // km/h
  windDirection: string;     // e.g. "SSW"
  windGust?: number;
  visibility: number;        // km
  cloudCover: number;        // %
  precipitation: number;     // mm/h
  precipitationProbability: number;
  condition: string;         // Human readable
  conditionCode: string;     // Standardized code
  uvIndex: number;
  dewPoint?: number;
  airQualityIndex?: number;
  airQualityCategory?: string;
  source: string;            // e.g. "IMD-AWS-National", "MockEngine"
  sourceStation?: string;
  quality: 'VALIDATED' | 'ESTIMATED' | 'RAW';
  dataFreshness: DataFreshness;
  isDemo?: boolean;
  ingestedAt: string;
  createdAt: string;
}

export interface HourlyForecastItem {
  time: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  conditionCode: string;
  precipitationProbability: number;
  rainfallMm: number;
  windSpeed: number;
  windDirection: string;
  humidity: number;
}

export interface DailyForecastItem {
  date: string;
  tempMin: number;
  tempMax: number;
  condition: string;
  conditionCode: string;
  precipitationProbability: number;
  rainfallMm: number;
  windSpeed: number;
  uvIndex: number;
  summary: string;
}

export interface ForecastRecord {
  id: string;
  locationId: string;
  locationName: string;
  provider: string;
  issuedAt: string;
  validFrom: string;
  validUntil: string;
  forecastType?: string;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  summaryText: string;
  synopticOverview?: string;
  source?: string;
  dataFreshness?: DataFreshness;
  createdAt: string;
  updatedAt?: string;
}

// ------------------------------------------------------------------------------
// 5. DISASTER RECORDS (Section 15, 27)
// ------------------------------------------------------------------------------
export interface DisasterRecord {
  id: string;
  name: string;
  hazardType: HazardType;
  state: string;
  district: string;
  location: string;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate?: string;
  year: number;
  severity: 'MODERATE' | 'SEVERE' | 'VERY_SEVERE' | 'EXTREME';
  deaths: number;
  affectedPopulation: number | string;
  economicLossEstimated?: string;
  maxWindKmph?: number;
  maxRainfallMm?: number;
  description: string;
  keyTakeaway?: string;
  source: string;            // e.g. "NDMA / IMD Historical Archive"
  sourceUrl?: string;
  confidence: 'CONFIRMED' | 'PRELIMINARY' | 'HISTORICAL_ESTIMATE';
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------------------------
// 6. ALERTS (Section 16, 17, 26)
// ------------------------------------------------------------------------------
export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  headline?: string;
  hazardType: HazardType;
  severity: AlertSeverity;
  status: AlertStatus;
  location: string;
  state: string;
  affectedRegions: string[];
  issuedAt: string;
  effectiveFrom: string;
  expiresAt: string;
  source: string;            // e.g. "IMD Regional Specialised Meteorological Centre"
  sourceUrl?: string;
  instructions: string[];
  bulletinNumber?: string;
  impactLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'CATASTROPHIC';
  latitude?: number;
  longitude?: number;
  createdBy: string;
  updatedBy: string;
  reviewedBy?: string;
  activatedBy?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------------------------
// 7. RISK INTELLIGENCE (Section 18, 19, 29)
// ------------------------------------------------------------------------------
export interface RiskFactorContribution {
  name: string;
  value: string | number;
  contribution: number;      // e.g. 0 to 40 contribution points
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

export interface HazardRiskBreakdown {
  hazard: HazardType;
  score: number;             // 0 to 100
  level: RiskLevel;
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  summary: string;
}

export interface RiskAssessmentRecord {
  id: string;
  locationId: string;
  locationName: string;
  state: string;
  riskScore: number;         // 0 to 100
  riskLevel: RiskLevel;
  calculatedAt: string;
  modelVersion: string;      // e.g. "WeatherGPT-Risk-v1"
  factors: RiskFactorContribution[];
  hazards: HazardRiskBreakdown[];
  explanation: string;
  recommendations: string[];
  isDemoData: boolean;
}

// ------------------------------------------------------------------------------
// 8. CHAT ENGINE (Section 20)
// ------------------------------------------------------------------------------
export interface ChatContextPayload {
  locationId?: string;
  locationName?: string;
  weather?: Partial<WeatherObservation>;
  riskLevel?: RiskLevel;
  riskScore?: number;
  activeAlerts?: string[];
  language?: string;
}

export interface ChatMessageRecord {
  id: string;
  sessionId: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  contextAttached?: ChatContextPayload;
  suggestedPrompts?: string[];
}

export interface ChatSessionRecord {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessageSnippet?: string;
}

// ------------------------------------------------------------------------------
// 9. AUDIT LOGGING (Section 31)
// ------------------------------------------------------------------------------
export interface AuditLogRecord {
  id: string;
  timestamp: string;
  actorId: string;
  actorEmail?: string;
  actorRole: Role;
  action: AuditAction;
  resourceType: 'ALERT' | 'USER' | 'DISASTER' | 'RISK' | 'SYSTEM' | 'WEATHER';
  resourceId: string;
  result: 'SUCCESS' | 'FAILURE';
  requestId: string;
  metadata?: Record<string, unknown>;
}

// ------------------------------------------------------------------------------
// 10. SYSTEM CONFIG & METRICS (Section 30)
// ------------------------------------------------------------------------------
export interface SystemHealthRecord {
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  timestamp: string;
  environment: string;
  version: string;
  services: {
    firestore: { status: 'UP' | 'DOWN'; latencyMs?: number };
    auth: { status: 'UP' | 'DOWN' };
    weatherProvider: { status: 'UP' | 'DOWN'; provider: string; dataFreshness: DataFreshness };
    riskEngine: { status: 'UP' | 'DOWN'; modelVersion: string };
  };
  metrics: {
    uptimeSeconds: number;
    activeAlertsCount: number;
    trackedLocationsCount: number;
  };
}

export interface MediaAssetRecord {
  id: string;
  url: string;
  publicId: string;
  format: string;
  resourceType: 'image' | 'video' | 'raw';
  bytes: number;
  createdAt: string;
  uploadedBy: string;
}

export interface ClimateRecord {
  id: string;
  locationId: string;
  region: string;
  parameter: 'temperature' | 'rainfall' | 'seaLevel' | 'extremeEvents';
  startYear: number;
  endYear: number;
  annualMean: number;
  anomaly: number;
  trendDirection: 'WARMING' | 'COOLING' | 'INCREASING' | 'DECREASING';
  historicalBaseline: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataSourceRecord {
  id: string;
  name: string;
  type: 'IMD_AWS' | 'DOPPLER_RADAR' | 'SATELLITE' | 'WRF_MODEL' | 'SYNTHETIC_MOCK';
  endpoint: string;
  status: 'ACTIVE' | 'DEGRADED' | 'MAINTENANCE' | 'OFFLINE';
  healthScore: number;
  lastSyncAt: string;
  updateFrequency: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SystemConfigRecord {
  id: string;
  key: string;
  value: unknown;
  category: 'RISK' | 'ALERTS' | 'INGESTION' | 'AUTH' | 'GENERAL';
  description: string;
  lastModifiedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemMetricsRecord {
  id: string;
  timestamp: string;
  activeAlertsCount: number;
  trackedLocationsCount: number;
  apiRequestsTotal: number;
  p95LatencyMs: number;
  errorRatePercent: number;
  cpuPercent?: number;
  memoryPercent?: number;
  dataFreshnessPercentage: number;
}

