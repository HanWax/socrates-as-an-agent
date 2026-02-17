import { logger } from "./logger";

let warnedMissingKey = false;
let warnedAllowUnauth = false;

export function checkApiAuth(
  request: Request,
): { ok: true } | { ok: false; reason: "missing_api_key" | "invalid_token" } {
  const apiKey = process.env.CHAT_API_KEY;
  const allowUnauth = process.env.ALLOW_UNAUTHENTICATED_CHAT === "true";

  if (!apiKey) {
    if (allowUnauth) {
      if (!warnedAllowUnauth) {
        logger.warn("auth_disabled", {
          reason: "CHAT_API_KEY missing",
          allowUnauth: true,
        });
        warnedAllowUnauth = true;
      }
      return { ok: true };
    }

    if (!warnedMissingKey) {
      logger.warn("auth_missing", { reason: "CHAT_API_KEY missing" });
      warnedMissingKey = true;
    }

    return { ok: false, reason: "missing_api_key" };
  }

  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token || token !== apiKey) {
    return { ok: false, reason: "invalid_token" };
  }

  return { ok: true };
}
