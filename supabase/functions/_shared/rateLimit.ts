// Persistent rate limit via public.hit_rate_limit (docs/sql/04_rate_limits.sql).
// Fails open if the DB call errors, so a DB hiccup never blocks real visitors.
export const getClientId = (req: Request): string =>
  req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
  req.headers.get("cf-connecting-ip") ||
  "unknown-client";

export async function hitRateLimit(
  bucket: string,
  clientKey: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return true;
  try {
    const res = await fetch(`${url}/rest/v1/rpc/hit_rate_limit`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ _bucket: bucket, _client_key: clientKey, _max: max, _window_seconds: windowSeconds }),
    });
    if (!res.ok) {
      console.error("rate limit rpc failed", res.status, await res.text());
      return true;
    }
    return (await res.json()) === true;
  } catch (e) {
    console.error("rate limit error", e);
    return true;
  }
}
