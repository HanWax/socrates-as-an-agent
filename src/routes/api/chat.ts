import { createFileRoute } from "@tanstack/react-router";
import { handleChatPost } from "../../lib/chat-handler";
import { preflightResponse } from "../../lib/cors";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => handleChatPost(request),
      OPTIONS: async ({ request }) => preflightResponse(request),
    },
  },
});
