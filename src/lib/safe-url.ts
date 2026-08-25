/** Relative paths only — blocks protocol-relative (`//`) and external redirects. */
export function safeCallbackPath(raw: string | null | undefined): string {
  if (!raw) return "/admin";
  let value = raw.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    return "/admin";
  }
  if (!value.startsWith("/")) return "/admin";
  if (value.startsWith("//") || value.startsWith("/\\")) return "/admin";
  if (value.includes("://") || value.includes("\\")) return "/admin";
  return value;
}

export function safeMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:") return parsed.toString();
  } catch {
    return undefined;
  }
  return undefined;
}
