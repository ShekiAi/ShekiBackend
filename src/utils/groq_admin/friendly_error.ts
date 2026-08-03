// utils/groq_admin/friendly_error.ts
//
// A raw Groq APIError's `.message` is literally the upstream HTTP body
// ("429 {\"error\":{\"message\":\"Rate limit reached...\"}}") — that reached a
// real user's screen verbatim once a completion call threw anywhere outside
// the malformed-tool-call recovery path, since every catch block up the
// chain (controllers included) just forwards `error.message` as-is. This
// maps known Groq failure shapes to something worth showing a student or
// tutor, while the real error still goes to the server logs via the caller.
export function friendlyGroqMessage(error: any): string {
  const status = error?.status ?? error?.error?.status;
  const code = error?.error?.error?.code || error?.error?.code || error?.code;

  if (status === 429 || code === "rate_limit_exceeded") {
    return "I'm getting a lot of requests right now and need a short breather — please try again in a few minutes.";
  }
  if (typeof status === "number" && status >= 500) {
    return "My thinking service is having a moment — please try again shortly.";
  }
  return "Something went wrong while I was working on that — please try again.";
}
