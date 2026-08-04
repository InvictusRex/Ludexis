const ACCESS_TOKEN_KEY = "ludexis_access_token";
const REFRESH_TOKEN_KEY = "ludexis_refresh_token";

type TokensClearedListener = () => void;

const tokensClearedListeners = new Set<TokensClearedListener>();

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token === null) {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  } else {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
}

export function setTokens(
  accessToken: string | null,
  refreshToken: string | null,
): void {
  setAccessToken(accessToken);
  if (typeof window === "undefined") return;
  if (refreshToken === null) {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  } else {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  tokensClearedListeners.forEach((listener) => listener());
}

export function onTokensCleared(listener: TokensClearedListener): () => void {
  tokensClearedListeners.add(listener);
  return () => tokensClearedListeners.delete(listener);
}
