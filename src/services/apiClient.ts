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
  private activeRole: DemoRole = 'USER';
  private authToken: string | null = null;
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

  getActiveRole(): DemoRole {
    return this.activeRole;
  }

  setActiveRole(role: DemoRole): void {
    this.activeRole = role;
  }

  setAuthToken(token: string | null): void {
    // In-memory token management only; never store JWT in localStorage
    this.authToken = token;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('weathergpt_access_token');
        localStorage.removeItem('weathergpt_simulated_role');
      } catch {
        // Safe handling for storage restrictions
      }
    }
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        // Security cleanup: Purge any legacy tokens from localStorage
        localStorage.removeItem('weathergpt_access_token');
        localStorage.removeItem('weathergpt_simulated_role');
      } catch {
        // Safe handling
      }
    }
  }

  private resolveUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    let target = `/api${cleanPath}`;

    if (
      cleanPath.startsWith('/auth') ||
      cleanPath.startsWith('/location') ||
      cleanPath.startsWith('/weather/coordinates') ||
      cleanPath.startsWith('/admin')
    ) {
      target = `/api${cleanPath}`;
    } else if (this.baseUrl && !this.baseUrl.includes('localhost:5001')) {
      target = `${this.baseUrl}${cleanPath}`;
    }

    if (typeof window === 'undefined' && !target.startsWith('http')) {
      const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://127.0.0.1:5173';
      return `${origin}${target}`;
    }

    return target;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
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
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
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

