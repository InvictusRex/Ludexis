// Tokens live in httpOnly cookies that page scripts cannot read; this module only announces
// that the session ended (refresh failed or the user logged out) so the UI can react.
type SessionEndedListener = () => void;

const listeners = new Set<SessionEndedListener>();

// Keys written by versions that kept tokens in localStorage.
const LEGACY_KEYS = ["ludexis_access_token", "ludexis_refresh_token", "ludexis_media_token"];

export function endSession(): void {
  if (typeof window !== "undefined") {
    LEGACY_KEYS.forEach((key) => window.localStorage.removeItem(key));
  }
  listeners.forEach((listener) => listener());
}

export function onSessionEnded(listener: SessionEndedListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
