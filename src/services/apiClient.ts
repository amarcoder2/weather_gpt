// ==============================================================================
// WEATHERGPT API CLIENT (Frontend Service Bridge)
// ==============================================================================

export type DemoRole = 'SUPER_ADMIN' | 'ADMIN' | 'ANALYST' | 'MODERATOR' | 'USER';

export interface ApiResponseEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    [key: string]: unknown;
  };
  requestId?: string;
}

class ApiClient {
  private activeRole: DemoRole = 'SUPER_ADMIN';
  private authToken: string | null = null;
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/weather-gpt-sih/asia-south1/api/v1';

  getActiveRole(): DemoRole {
    return this.activeRole;
  }

  setActiveRole(role: DemoRole): void {
    this.activeRole = role;
    if (typeof window !== 'undefined') {
      localStorage.setItem('weathergpt_simulated_role', role);
    }
  }

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('weathergpt_simulated_role') as DemoRole;
      if (saved) {
        this.activeRole = saved;
      }
    }
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-WeatherGPT-Role': this.activeRole,
      'X-WeatherGPT-Uid': `demo_${this.activeRole.toLowerCase()}_user`,
      'X-WeatherGPT-Email': `${this.activeRole.toLowerCase()}@weathergpt.gov.in`,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  async get<T>(path: string): Promise<ApiResponseEnvelope<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return await res.json();
    } catch {
      return {
        success: false,
        error: { code: 'NETWORK_OFFLINE', message: 'Backend service offline or unreachable' },
      };
    }
  }

  async post<T>(path: string, body: unknown): Promise<ApiResponseEnvelope<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });
      return await res.json();
    } catch {
      return {
        success: false,
        error: { code: 'NETWORK_OFFLINE', message: 'Backend service offline or unreachable' },
      };
    }
  }

  async patch<T>(path: string, body: unknown): Promise<ApiResponseEnvelope<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });
      return await res.json();
    } catch {
      return {
        success: false,
        error: { code: 'NETWORK_OFFLINE', message: 'Backend service offline or unreachable' },
      };
    }
  }

  async delete<T>(path: string): Promise<ApiResponseEnvelope<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return await res.json();
    } catch {
      return {
        success: false,
        error: { code: 'NETWORK_OFFLINE', message: 'Backend service offline or unreachable' },
      };
    }
  }
}

export const apiClient = new ApiClient();
