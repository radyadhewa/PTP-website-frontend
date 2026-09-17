export interface ApiErrorPayload {
  error: string;
  requestId?: string;
}

export interface AuthPayload {
  email: string;
  password: string;
}

export interface SignupPayload extends AuthPayload {
  confirmPassword: string;
}

export interface AuthResponse {
  email: string;
}

export interface AdminLoginPayload {
  username: string;
  password: string;
}

export interface AdminAuthResponse {
  authenticated: boolean;
  username: string;
}

export interface CuratedBookInput {
  title: string;
  author: string;
  text: string;
  genre: string;
  difficulty: string;
  length: string;
  summary?: string;
}
