/**
 * POST /api/vote
 *
 * Body:
 *   { "supplier": 25, "vote": "like" }
 *
 * KV binding placeholder:
 *   SUPPLY_KV
 *
 * Data model:
 *   votes:all
 *     {
 *       "25": { "likes": 3, "dislikes": 1 }
 *     }
 *
 *   vote:<supplier>:<anonymous-voter-key>
 *     { "vote": "like" }
 *
 * The anonymous-voter key is derived server-side from the request's
 * Cloudflare-provided connecting IP. The raw IP is never stored.
 *
 * NOTE:
 * Workers KV does not provide an atomic read-modify-write counter.
 * For a small site this is acceptable, but very high concurrent voting
 * would be better handled by Durable Objects or D1.
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.SUPPLY_KV) {
    return json({
      error: "SUPPLY_KV binding is not configured yet.",
      code: "KV_NOT_BOUND"
    }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const supplier = Number(body?.supplier);
  const vote = body?.vote;

  if (!Number.isInteger(supplier) || supplier < 0) {
    return json({ error: "Invalid supplier." }, 400);
  }

  if (vote !== "like" && vote !== "dislike") {
    return json({ error: "Vote must be 'like' or 'dislike'." }, 400);
  }

  // Cloudflare supplies this header at the edge.
  const rawIP =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const voterKey = await sha256(rawIP);
  const voterRecordKey = `vote:${supplier}:${voterKey}`;

  try {
    const currentVoteRecord = await env.SUPPLY_KV.get(voterRecordKey, "json");
    const currentVote = currentVoteRecord?.vote || null;

    // Clicking the same vote again removes the vote.
    const nextVote = currentVote === vote ? null : vote;

    const allVotes = (await env.SUPPLY_KV.get("votes:all", "json")) || {};
    const key = String(supplier);

    if (!allVotes[key]) {
      allVotes[key] = { likes: 0, dislikes: 0 };
    }

    // Remove the old vote from the aggregate.
    if (currentVote === "like") {
      allVotes[key].likes = Math.max(0, Number(allVotes[key].likes || 0) - 1);
    } else if (currentVote === "dislike") {
      allVotes[key].dislikes = Math.max(0, Number(allVotes[key].dislikes || 0) - 1);
    }

    // Add the new vote if the click did not remove it.
    if (nextVote === "like") {
      allVotes[key].likes = Number(allVotes[key].likes || 0) + 1;
      await env.SUPPLY_KV.put(voterRecordKey, JSON.stringify({ vote: "like" }));
    } else if (nextVote === "dislike") {
      allVotes[key].dislikes = Number(allVotes[key].dislikes || 0) + 1;
      await env.SUPPLY_KV.put(voterRecordKey, JSON.stringify({ vote: "dislike" }));
    } else {
      await env.SUPPLY_KV.delete(voterRecordKey);
    }

    await env.SUPPLY_KV.put("votes:all", JSON.stringify(allVotes));

    return json({
      ok: true,
      supplier,
      vote: nextVote,
      votes: allVotes[key]
    }, 200, {
      "Cache-Control": "no-store"
    });
  } catch (error) {
    console.error("POST /api/vote failed:", error);
    return json({
      error: "Unable to save vote."
    }, 500);
  }
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
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
