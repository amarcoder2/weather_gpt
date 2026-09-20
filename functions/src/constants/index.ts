// ==============================================================================
// WEATHERGPT BACKEND CONSTANTS (SIH 2026 #26068)
// ==============================================================================

export const ROLES = {
  USER: 'USER',
  MODERATOR: 'MODERATOR',
  ANALYST: 'ANALYST',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const ROLE_HIERARCHY: Record<Role, number> = {
  USER: 1,
  MODERATOR: 2,
  ANALYST: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5,
};

export const ALERT_SEVERITY = {
  INFO: 'INFO',
  WATCH: 'WATCH',
  WARNING: 'WARNING',
  SEVERE: 'SEVERE',
} as const;

export type AlertSeverity = typeof ALERT_SEVERITY[keyof typeof ALERT_SEVERITY];

export const ALERT_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export type AlertStatus = typeof ALERT_STATUS[keyof typeof ALERT_STATUS];

export const HAZARD_TYPES = {
  FLOOD: 'FLOOD',
  CYCLONE: 'CYCLONE',
  HEATWAVE: 'HEATWAVE',
  DROUGHT: 'DROUGHT',
  LANDSLIDE: 'LANDSLIDE',
  LIGHTNING: 'LIGHTNING',
  THUNDERSTORM: 'THUNDERSTORM',
  HEAVY_RAIN: 'HEAVY_RAIN',
  COLD_WAVE: 'COLD_WAVE',
  EARTHQUAKE: 'EARTHQUAKE',
  TSUNAMI: 'TSUNAMI',
  OTHER: 'OTHER',
} as const;

export type HazardType = typeof HAZARD_TYPES[keyof typeof HAZARD_TYPES];

export const RISK_LEVELS = {
  LOW: 'LOW',
  MODERATE: 'MODERATE',
  ELEVATED: 'ELEVATED',
  HIGH: 'HIGH',
  EXTREME: 'EXTREME',
} as const;

export type RiskLevel = typeof RISK_LEVELS[keyof typeof RISK_LEVELS];

export const RISK_THRESHOLDS = {
  LOW_MAX: 19,
  MODERATE_MAX: 39,
  ELEVATED_MAX: 59,
  HIGH_MAX: 79,
  EXTREME_MAX: 100,
} as const;

export const DATA_FRESHNESS = {
  LIVE: 'LIVE',         // < 15 minutes old
  FRESH: 'FRESH',       // Freshly ingested
  RECENT: 'RECENT',     // < 1 hour old
  STALE: 'STALE',       // > 1 hour old
  UNKNOWN: 'UNKNOWN',   // Unverifiable
  DEMO: 'DEMO',         // Synthetic/mock test data
  UNAVAILABLE: 'UNAVAILABLE',
} as const;

export type DataFreshness = typeof DATA_FRESHNESS[keyof typeof DATA_FRESHNESS];

export const AUDIT_ACTIONS = {
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  USER_STATUS_CHANGED: 'USER_STATUS_CHANGED',
  ALERT_CREATED: 'ALERT_CREATED',
  ALERT_REVIEW_REQUESTED: 'ALERT_REVIEW_REQUESTED',
  ALERT_ACTIVATED: 'ALERT_ACTIVATED',
  ALERT_CANCELLED: 'ALERT_CANCELLED',
  ALERT_EXPIRED: 'ALERT_EXPIRED',
  DISASTER_CREATED: 'DISASTER_CREATED',
  DISASTER_UPDATED: 'DISASTER_UPDATED',
  RISK_RECALCULATED: 'RISK_RECALCULATED',
  SYSTEM_CONFIG_CHANGED: 'SYSTEM_CONFIG_CHANGED',
  ADMIN_LOGIN: 'ADMIN_LOGIN',
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];
