import { createFileRoute } from "@tanstack/react-router";
import { checkApiAuth } from "../../lib/auth";
import { logger } from "../../lib/logger";
import { getAvailableModels } from "../../lib/model";
import { getClientIp } from "../../lib/rate-limit";

export const Route = createFileRoute("/api/models")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await checkApiAuth(request);
        if (!auth.ok) {
          logger.warn("auth_failed", {
            ip: getClientIp(request),
            reason: auth.reason,
            route: "models_list",
          });
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify(getAvailableModels()), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
