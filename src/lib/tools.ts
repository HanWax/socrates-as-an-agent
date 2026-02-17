import { tool } from "ai";
import { z } from "zod";
import { getDb } from "./db";

export const tools = {
  webSearch: tool({
    description:
      "Search the web for current facts or evidence relevant to the topic being discussed. Use this to ground your Socratic questions in real-world information.",
    inputSchema: z.object({
      query: z.string().max(500).describe("The search query"),
    }),
    async execute({ query }) {
      const apiKey = process.env.TAVILY_API_KEY;
      if (!apiKey) {
        return { results: [], error: "TAVILY_API_KEY is not set" };
      }

      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          max_results: 5,
          include_answer: false,
        }),
      });

      if (!response.ok) {
        return { results: [], error: `Tavily API error: ${response.status}` };
      }

      const data = (await response.json()) as {
        results: Array<{
          title: string;
          url: string;
          content: string;
        }>;
      };

      return {
        results: data.results.map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.content.slice(0, 300),
        })),
      };
    },
  }),

  saveInsight: tool({
    description:
      "Save a breakthrough insight or realization that the user has reached during the Socratic dialogue. Only call this when the user has clearly articulated a genuine understanding.",
    inputSchema: z.object({
      insight: z
        .string()
        .max(1000)
        .describe("The insight or realization the user reached"),
      topic: z
        .string()
        .max(100)
        .optional()
        .describe("The topic area of the insight"),
    }),
    async execute({ insight, topic }) {
      try {
        const sql = getDb();
        await sql`INSERT INTO insights (insight, topic) VALUES (${insight}, ${topic ?? null})`;
        return { saved: true, insight, topic: topic ?? null };
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return { saved: false, insight, topic: topic ?? null, error: message };
      }
    },
  }),
};
