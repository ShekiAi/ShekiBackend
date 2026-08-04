// utils/keepAlive.ts
//
// Render's free tier spins a web service down after ~15 minutes with no
// inbound traffic — the next real request then has to cold-boot the whole
// instance, which routinely takes far longer than a caller's patience (GOYE's
// own proxy in mentor_match_client.ts/course_draft_client.ts gives up and
// reports a 502 rather than hang indefinitely). Self-pinging our own public
// URL every few minutes generates the inbound traffic Render's inactivity
// timer actually tracks, keeping the instance warm.
//
// RENDER_EXTERNAL_URL is set automatically by Render on every web service —
// its presence is also how this stays a no-op in local dev, where there's no
// public URL (and no sleeping to prevent).
const PING_INTERVAL_MS = 10 * 60 * 1000; // well under the ~15min sleep threshold

export function startKeepAlive() {
  const baseUrl = process.env.RENDER_EXTERNAL_URL;
  if (!baseUrl) return;

  setInterval(() => {
    fetch(`${baseUrl}/health`).catch((error) => {
      // Best-effort — a failed ping just means we try again next interval,
      // never worth taking the server down over.
      console.error("[KeepAlive] self-ping failed:", error?.message || error);
    });
  }, PING_INTERVAL_MS);

  console.log(`[KeepAlive] Pinging ${baseUrl}/health every ${PING_INTERVAL_MS / 60000} minutes to prevent Render free-tier sleep`);
}
