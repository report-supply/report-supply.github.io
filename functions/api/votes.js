/**
 * GET /api/votes
 *
 * Returns all KV-backed vote deltas.
 *
 * KV binding placeholder:
 *   SUPPLY_KV
 *
 * Configure this binding in Cloudflare Workers & Pages later.
 */
export async function onRequestGet(context) {
  try {
    const { env } = context;

    if (!env.SUPPLY_KV) {
      return json({
        error: "SUPPLY_KV binding is not configured yet.",
        code: "KV_NOT_BOUND"
      }, 503);
    }

    const value = await env.SUPPLY_KV.get("votes:all", "json");

    return json(value || {}, 200, {
      "Cache-Control": "no-store"
    });
  } catch (error) {
    console.error("GET /api/votes failed:", error);
    return json({
      error: "Unable to load vote data."
    }, 500);
  }
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders
    }
  });
}
