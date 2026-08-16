export function safeAppPath(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://") || path.includes("\\")) {
    return null;
  }
  if (path.startsWith("/admin") || path.startsWith("/app")) return path;
  return null;
}

export function loginHref(opts: { error?: string; next?: string | null; vue?: string }) {
  const q = new URLSearchParams();
  if (opts.error) q.set("error", opts.error);
  if (opts.next) q.set("next", opts.next);
  if (opts.vue === "admin") q.set("vue", "admin");
  const s = q.toString();
  return s ? `/login?${s}` : "/login";
}
