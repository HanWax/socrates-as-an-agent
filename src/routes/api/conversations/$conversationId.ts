import { createFileRoute } from "@tanstack/react-router";
import { checkApiAuth } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { logger } from "../../../lib/logger";
import { checkAuthRateLimit, getClientIp } from "../../../lib/rate-limit";

export const Route = createFileRoute("/api/conversations/$conversationId")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        try {
          const auth = await checkApiAuth(request);
          if (!auth.ok) {
            logger.warn("auth_failed", {
              ip: getClientIp(request),
              reason: auth.reason,
              route: "conversations_get",
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

          const { conversationId } = params;
          const sql = getDb();
          const convRows = await sql`
            SELECT id, title, created_at, updated_at
            FROM conversations
            WHERE id = ${conversationId} AND user_id = ${auth.userId}
          `;
          if (convRows.length === 0) {
            return new Response(
              JSON.stringify({ error: "Conversation not found" }),
              { status: 404, headers: { "Content-Type": "application/json" } },
            );
          }
          const msgRows = await sql`
            SELECT id, role, content, created_at
            FROM messages
            WHERE conversation_id = ${conversationId}
            ORDER BY created_at ASC
          `;
          return new Response(
            JSON.stringify({
              ...convRows[0],
              messages: msgRows,
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        } catch (e) {
          logger.error("conversations_get_error", {
            error: e instanceof Error ? e.message : "Unknown error",
          });
          return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
      DELETE: async ({ params, request }) => {
        try {
          const auth = await checkApiAuth(request);
          if (!auth.ok) {
            logger.warn("auth_failed", {
              ip: getClientIp(request),
              reason: auth.reason,
              route: "conversations_delete",
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

          const { conversationId } = params;
          const sql = getDb();
          const rows = await sql`
            DELETE FROM conversations
            WHERE id = ${conversationId} AND user_id = ${auth.userId}
            RETURNING id
          `;
          if (rows.length === 0) {
            return new Response(
              JSON.stringify({ error: "Conversation not found" }),
              { status: 404, headers: { "Content-Type": "application/json" } },
            );
          }
          return new Response(JSON.stringify({ deleted: true }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          logger.error("conversations_delete_error", {
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
