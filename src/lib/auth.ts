import { auth } from "@clerk/tanstack-react-start/server";
import { logger } from "./logger";

type AuthFailureReason = "unauthenticated" | "auth_unavailable";

export async function checkApiAuth(
  _request: Request,
): Promise<
  { ok: true; userId: string } | { ok: false; reason: AuthFailureReason }
> {
  try {
    const session = await auth();
    if (!session.userId) {
      return { ok: false, reason: "unauthenticated" };
    }

    return { ok: true, userId: session.userId };
  } catch (error) {
    logger.warn("auth_unavailable", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { ok: false, reason: "auth_unavailable" };
  }
}
