// ==============================================================================
// WEATHERGPT STRUCTURED LOGGER (SIH 2026 #26068)
// ==============================================================================

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogPayload {
  timestamp?: string;
  severity: LogLevel;
  service: string;
  functionName?: string;
  requestId?: string;
  userId?: string;
  operation?: string;
  durationMs?: number;
  message: string;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}

class Logger {
  private formatLog(payload: LogPayload): string {
    const entry = {
      timestamp: new Date().toISOString(),
      ...payload,
    };
    return JSON.stringify(entry);
  }

  debug(message: string, meta: Omit<LogPayload, 'severity' | 'message'> = { service: 'WeatherGPT' }): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatLog({ severity: 'DEBUG', message, ...meta }));
    }
  }

  info(message: string, meta: Omit<LogPayload, 'severity' | 'message'> = { service: 'WeatherGPT' }): void {
    console.info(this.formatLog({ severity: 'INFO', message, ...meta }));
  }

  warn(message: string, meta: Omit<LogPayload, 'severity' | 'message'> = { service: 'WeatherGPT' }): void {
    console.warn(this.formatLog({ severity: 'WARN', message, ...meta }));
  }

  error(message: string, meta: Omit<LogPayload, 'severity' | 'message'> = { service: 'WeatherGPT' }): void {
    console.error(this.formatLog({ severity: 'ERROR', message, ...meta }));
  }
}

export const logger = new Logger();
