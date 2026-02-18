import { createFileRoute } from "@tanstack/react-router";
import { checkApiAuth } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { logger } from "../../../lib/logger";
import { MAX_BODY_SIZE } from "../../../lib/message-validation";
import { checkAuthRateLimit, getClientIp } from "../../../lib/rate-limit";

export const Route = createFileRoute("/api/conversations/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const auth = await checkApiAuth(request);
          if (!auth.ok) {
            logger.warn("auth_failed", {
              ip: getClientIp(request),
              reason: auth.reason,
              route: "conversations_list",
            });
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const userRate = checkAuthRateLimit(auth.userId);
          if (!userRate.allowed) {
            return new Response(
              JSON.stringify({ error: "Too many requests" }),
              { status: 429, headers: { "Content-Type": "application/json" } },
            );
          }

          const url = new URL(request.url);
          const limit = Math.min(
            Number(url.searchParams.get("limit") ?? 50),
            100,
          );
          const sql = getDb();
          const rows = await sql`
            SELECT id, title, created_at, updated_at
            FROM conversations
            WHERE user_id = ${auth.userId}
            ORDER BY updated_at DESC
            LIMIT ${limit}
          `;
          return new Response(JSON.stringify({ conversations: rows }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          logger.error("conversations_list_error", {
            error: e instanceof Error ? e.message : "Unknown error",
          });
          return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
      POST: async ({ request }) => {
        try {
          const auth = await checkApiAuth(request);
          if (!auth.ok) {
            logger.warn("auth_failed", {
              ip: getClientIp(request),
              reason: auth.reason,
              route: "conversations_create",
            });
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const userRate = checkAuthRateLimit(auth.userId);
          if (!userRate.allowed) {
            return new Response(
              JSON.stringify({ error: "Too many requests" }),
              { status: 429, headers: { "Content-Type": "application/json" } },
            );
          }

          const contentLength = request.headers.get("content-length");
          if (
            contentLength &&
            Number.parseInt(contentLength, 10) > MAX_BODY_SIZE
          ) {
            return new Response(
              JSON.stringify({ error: "Request body too large" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const body = (await request.json()) as { title?: string };
          const title = body.title ?? "New conversation";
          const sql = getDb();
          const rows = await sql`
            INSERT INTO conversations (title, user_id)
            VALUES (${title}, ${auth.userId})
            RETURNING id, title, created_at, updated_at
          `;
          return new Response(JSON.stringify(rows[0]), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          logger.error("conversations_create_error", {
            error: e instanceof Error ? e.message : "Unknown error",
          });
          return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
