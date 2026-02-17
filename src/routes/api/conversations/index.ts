import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "../../../lib/db";

export const Route = createFileRoute("/api/conversations/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const limit = Math.min(
            Number(url.searchParams.get("limit") ?? 50),
            100,
          );
          const sql = getDb();
          const rows = await sql`
            SELECT id, title, created_at, updated_at
            FROM conversations
            ORDER BY updated_at DESC
            LIMIT ${limit}
          `;
          return new Response(JSON.stringify({ conversations: rows }), {
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
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { title?: string };
          const title = body.title ?? "New conversation";
          const sql = getDb();
          const rows = await sql`
            INSERT INTO conversations (title)
            VALUES (${title})
            RETURNING id, title, created_at, updated_at
          `;
          return new Response(JSON.stringify(rows[0]), {
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
