export type UserRole = 'USER' | 'MODERATOR' | 'ANALYST' | 'ADMIN' | 'SUPER_ADMIN';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  preferredLanguage?: string;
  preferredLocation?: string;
  preferredLocationId?: string;
  notificationPreferences?: NotificationSettings;
  accessibility?: AccessibilitySettings;
  status?: 'ACTIVE' | 'SUSPENDED';
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface NotificationSettings {
  severeWeather: boolean;
  heavyRain: boolean;
  cycloneAlert: boolean;
  floodWarning: boolean;
  heatwaveAlert: boolean;
  dailyForecastDigest: boolean;
}

export interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  largeFonts: boolean;
  screenReaderOptimized: boolean;
}

export interface UserPreferences {
  preferredLocationId: string;
  language: string;
  temperatureUnit: 'C' | 'F';
  windSpeedUnit: 'kmh' | 'knots' | 'mph';
  rainfallUnit: 'mm' | 'inches';
  voiceSpeed: number; // 0.8 to 1.2
  voiceLanguage: string;
  notifications: NotificationSettings;
  accessibility: AccessibilitySettings;
}

