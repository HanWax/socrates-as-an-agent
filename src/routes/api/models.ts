import { createFileRoute } from "@tanstack/react-router";
import { getAvailableModels } from "../../lib/model";

export const Route = createFileRoute("/api/models")({
  server: {
    handlers: {
      GET: async () =>
        new Response(JSON.stringify(getAvailableModels()), {
          headers: { "Content-Type": "application/json" },
        }),
    },
  },
});
