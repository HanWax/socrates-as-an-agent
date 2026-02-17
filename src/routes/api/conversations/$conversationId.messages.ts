import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "../../../lib/db";

export const Route = createFileRoute(
  "/api/conversations/$conversationId/messages",
)({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          const { conversationId } = params;
          const body = (await request.json()) as {
            role: string;
            content: unknown;
          };
          const { role, content } = body;

          if (!role || !content) {
            return new Response(
              JSON.stringify({ error: "role and content are required" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          if (role !== "user" && role !== "assistant") {
            return new Response(
              JSON.stringify({ error: "role must be 'user' or 'assistant'" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const sql = getDb();

          // Save the message (content is passed as-is; the column should be JSONB)
          const contentJson = JSON.stringify(content);
          const msgRows = await sql`
            INSERT INTO messages (conversation_id, role, content)
            VALUES (${conversationId}, ${role}, ${contentJson}::jsonb)
            RETURNING id, role, content, created_at
          `;

          // Update conversation's updated_at
          await sql`
            UPDATE conversations
            SET updated_at = now()
            WHERE id = ${conversationId}
          `;

          // Auto-set title from first user message
          if (role === "user") {
            const countRows = await sql`
              SELECT COUNT(*) as cnt FROM messages
              WHERE conversation_id = ${conversationId} AND role = 'user'
            `;
            const count = Number(countRows[0]?.cnt ?? 0);
            if (count === 1) {
              // Extract text from content (JSONB parts array)
              let titleText = "New conversation";
              const parts = content as Array<{ type: string; text?: string }>;
              if (Array.isArray(parts)) {
                const textPart = parts.find(
                  (p) => p.type === "text" && typeof p.text === "string",
                );
                if (textPart?.text) {
                  titleText = textPart.text.slice(0, 50);
                }
              }
              await sql`
                UPDATE conversations
                SET title = ${titleText}
                WHERE id = ${conversationId}
              `;
            }
          }

          return new Response(JSON.stringify(msgRows[0]), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          const message = e instanceof Error ? e.message : "Unknown error";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
