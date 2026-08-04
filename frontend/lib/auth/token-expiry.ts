export function decodeJwtPayload(
  token: string | null | undefined,
): Record<string, unknown> | null {
  if (!token) return null;

  try {
    const parts = token.split(".");

    if (parts.length !== 3) return null;

    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded = payload.padEnd(
      payload.length + ((4 - (payload.length % 4)) % 4),
      "=",
    );

    const parsed: unknown = JSON.parse(atob(padded));

    if (typeof parsed !== "object" || parsed === null) return null;

    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getTokenExpiry(
  token: string | null | undefined,
): number | null {
  const payload = decodeJwtPayload(token);

  if (!payload) return null;

  const exp = payload.exp;

  if (typeof exp !== "number" || !Number.isFinite(exp)) return null;

  return exp * 1000;
}

export function isExpired(expiresAtMs: number, nowMs = Date.now()): boolean {
  return nowMs >= expiresAtMs;
}

export function msUntilExpiry(expiresAtMs: number, nowMs: number): number {
  return expiresAtMs - nowMs;
}
