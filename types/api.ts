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
