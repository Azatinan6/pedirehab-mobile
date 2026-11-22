export type UserRole = 'THERAPIST' | 'PATIENT';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  role: UserRole;
  fullName: string | null;
}

export interface AuthUser {
  username: string;
  role: UserRole;
  fullName: string | null;
}
