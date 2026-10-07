export function year(date?: string | null): string | undefined {
  return date ? date.slice(0, 4) : undefined;
}

export function formatDate(date?: string | null): string {
  if (!date) {
    return "—";
  }
  return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const UNITS = ["B", "KB", "MB", "GB", "TB"];

export function formatBytes(bytes?: number | null): string | undefined {
  if (bytes == null) {
    return undefined;
  }
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${UNITS[unit]}`;
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count.toLocaleString()} ${count === 1 ? one : many}`;
}
