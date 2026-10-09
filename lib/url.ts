/** If the visitor typed a bare domain ("bbc.com/cymrufyw"), assume https —
 * this audience will not reliably type a scheme. Leaves anything that
 * already looks like it has a scheme alone. */
export function withScheme(url: string): string {
  const trimmed = url.trim();
  if (trimmed.length === 0 || /^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** An http(s) address whose host has a dot in it ("example.com"), so a
 * stray word like "hello" — which becomes "https://hello" — is rejected.
 * Shared by the form (instant feedback) and the API (the real check). */
export function isWebAddress(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname;
    return host.includes(".") && !host.startsWith(".") && !host.endsWith(".");
  } catch {
    return false;
  }
}
