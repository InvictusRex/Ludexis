export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  // Present for tooling; the browser session itself lives in httpOnly cookies.
  access_token?: string | null;
  refresh_token?: string | null;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
}
