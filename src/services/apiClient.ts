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
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

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
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('weathergpt_access_token', token);
      } else {
        localStorage.removeItem('weathergpt_access_token');
      }
    }
  }

  getAuthToken(): string | null {
    if (!this.authToken && typeof window !== 'undefined') {
      this.authToken = localStorage.getItem('weathergpt_access_token');
    }
    return this.authToken;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('weathergpt_simulated_role') as DemoRole;
      if (saved) {
        this.activeRole = saved;
      }
      const savedToken = localStorage.getItem('weathergpt_access_token');
      if (savedToken) {
        this.authToken = savedToken;
      }
    }
  }

  private resolveUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    if (
      cleanPath.startsWith('/auth') ||
      cleanPath.startsWith('/location') ||
      cleanPath.startsWith('/weather/coordinates')
    ) {
      return `/api${cleanPath}`;
    }
    if (this.baseUrl && !this.baseUrl.includes('localhost:5001')) {
      return `${this.baseUrl}${cleanPath}`;
    }
    return `/api${cleanPath}`;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-WeatherGPT-Role': this.activeRole,
      'X-WeatherGPT-Uid': `demo_${this.activeRole.toLowerCase()}_user`,
      'X-WeatherGPT-Email': `${this.activeRole.toLowerCase()}@weathergpt.gov.in`,
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async get<T>(path: string): Promise<ApiResponseEnvelope<T>> {
    try {
      const res = await fetch(this.resolveUrl(path), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || { code: 'REQUEST_FAILED', message: data.message || `HTTP ${res.status}` },
          data,
        };
      }
      return { success: true, data };
    } catch {
      return {
        success: false,
        error: { code: 'NETWORK_OFFLINE', message: 'Backend service offline or unreachable' },
      };
    }
  }

  async post<T>(path: string, body: unknown): Promise<ApiResponseEnvelope<T>> {
    try {
      const res = await fetch(this.resolveUrl(path), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || { code: 'REQUEST_FAILED', message: data.message || `HTTP ${res.status}` },
          data,
        };
      }
      return { success: true, data };
    } catch {
      return {
        success: false,
        error: { code: 'NETWORK_OFFLINE', message: 'Backend service offline or unreachable' },
      };
    }
  }

  async patch<T>(path: string, body: unknown): Promise<ApiResponseEnvelope<T>> {
    try {
      const res = await fetch(this.resolveUrl(path), {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || { code: 'REQUEST_FAILED', message: data.message || `HTTP ${res.status}` },
          data,
        };
      }
      return { success: true, data };
    } catch {
      return {
        success: false,
        error: { code: 'NETWORK_OFFLINE', message: 'Backend service offline or unreachable' },
      };
    }
  }

  async delete<T>(path: string): Promise<ApiResponseEnvelope<T>> {
    try {
      const res = await fetch(this.resolveUrl(path), {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || { code: 'REQUEST_FAILED', message: data.message || `HTTP ${res.status}` },
          data,
        };
      }
      return { success: true, data };
    } catch {
      return {
        success: false,
        error: { code: 'NETWORK_OFFLINE', message: 'Backend service offline or unreachable' },
      };
    }
  }
}

export const apiClient = new ApiClient();

