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

  mapArgument: tool({
    description:
      "Map out the logical structure of an argument with premises, evidence, conclusion, and counterarguments. Use this when the user is constructing or defending a structured argument.",
    inputSchema: z.object({
      claim: z.string().describe("The main claim or thesis being argued"),
      premises: z
        .array(
          z.object({
            text: z.string().describe("The premise statement"),
            evidence: z
              .array(z.string())
              .describe("Supporting evidence for this premise"),
          }),
        )
        .describe("The premises supporting the claim"),
      conclusion: z.string().describe("The conclusion drawn from the premises"),
      counterarguments: z
        .array(
          z.object({
            point: z.string().describe("The counterargument"),
            rebuttal: z
              .string()
              .optional()
              .describe("Optional rebuttal to the counterargument"),
          }),
        )
        .optional()
        .describe("Counterarguments to the claim"),
    }),
    execute: async (input) => input,
  }),

  suggestReading: tool({
    description:
      "Recommend curated reading materials on a topic. Include a mix of difficulty levels and resource types. Only recommend real, well-known works.",
    inputSchema: z.object({
      topic: z.string().describe("The topic for reading recommendations"),
      recommendations: z
        .array(
          z.object({
            title: z.string().describe("Title of the work"),
            author: z.string().describe("Author of the work"),
            type: z
              .enum(["book", "article", "paper", "video"])
              .describe("Type of resource"),
            description: z
              .string()
              .describe("Brief description of why this is recommended"),
            difficulty: z
              .enum(["beginner", "intermediate", "advanced"])
              .describe("Difficulty level"),
          }),
        )
        .describe("List of reading recommendations"),
    }),
    execute: async (input) => input,
  }),

  discoverResources: tool({
    description:
      "Search for recently published content (articles, podcasts, essays, videos, newsletters) relevant to the current discussion. Use this to surface fresh perspectives the user likely hasn't encountered.",
    inputSchema: z.object({
      query: z
        .string()
        .max(500)
        .describe("Search query to find recent relevant content"),
      topic: z.string().max(200).describe("The broader topic being discussed"),
      reason: z
        .string()
        .max(500)
        .describe(
          "Why these resources matter for this conversation — how they connect to what the user is exploring",
        ),
    }),
    async execute({ query, topic, reason }) {
      const apiKey = process.env.TAVILY_API_KEY;
      if (!apiKey) {
        return {
          topic,
          reason,
          resources: [],
          error: "TAVILY_API_KEY is not set",
        };
      }

      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          max_results: 5,
          days: 14,
          include_answer: false,
        }),
      });

      if (!response.ok) {
        return {
          topic,
          reason,
          resources: [],
          error: `Tavily API error: ${response.status}`,
        };
      }

      const data = (await response.json()) as {
        results: Array<{
          title: string;
          url: string;
          content: string;
          published_date?: string;
        }>;
      };

      return {
        topic,
        reason,
        resources: data.results.map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.content.slice(0, 300),
          publishedDate: r.published_date ?? null,
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
