export type UserRole =
  | 'admin'
  | 'user'
  | 'analyst'
  | 'ADMIN'
  | 'USER'
  | 'SUPER_ADMIN'
  | 'MODERATOR';

export interface DbUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  latitude?: number | null;
  longitude?: number | null;
  location_name?: string | null;
  location_updated_at?: string | null;
  created_at: string;
  last_login: string;
}

export interface AuthUser {
  id: string;
  uid: string;
  name: string;
  displayName: string;
  email: string;
  role: UserRole;
  latitude?: number | null;
  longitude?: number | null;
  location_name?: string | null;
  location_updated_at?: string | null;
  created_at?: string;
  last_login?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}
