export interface RegisterResponse {
  id: string;
  email: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string };
}

export interface RefreshTokenResponse {
  accessToken: string;
  newRefreshToken: string;
}

export interface MessageResponse {
  message: string;
}

export interface SuccessResponse {
  success: boolean;
}
