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

  drawDiagram: tool({
    description:
      "Draw a visual diagram to illustrate a concept, argument, or process. Use flowcharts for argument structures, decision trees, cause-and-effect chains. Use sequence diagrams for back-and-forth interactions. Use class diagrams for entity relationships. Keep diagrams simple — 4-8 nodes is ideal.",
    inputSchema: z.object({
      title: z.string().describe("Brief diagram title"),
      diagramType: z
        .enum(["flowchart", "sequence", "class"])
        .describe("The type of Mermaid diagram"),
      mermaidSyntax: z.string().describe("Valid Mermaid diagram code"),
    }),
    execute: async (input) => input,
  }),

  retrievalPractice: tool({
    description:
      "Structure a recall challenge after teaching a concept. Use this after 3-4 substantive exchanges on a topic to test the user's understanding. First call with status 'question' to pose the challenge, then with status 'feedback' after the user responds.",
    inputSchema: z.object({
      topic: z.string().describe("The concept being tested"),
      status: z
        .enum(["question", "feedback"])
        .describe("Which phase of the recall loop"),
      question: z.string().describe("The retrieval question"),
      hint: z.string().optional().describe("A nudge if the user is stuck"),
      feedback: z
        .object({
          assessment: z
            .enum(["strong", "partial", "needs_work"])
            .describe("How well the user recalled the concept"),
          whatWasRight: z
            .array(z.string())
            .describe("Points the user got right"),
          whatWasMissed: z.array(z.string()).describe("Points the user missed"),
          correctedExplanation: z
            .string()
            .describe("The corrected or complete explanation"),
          followUpQuestion: z
            .string()
            .describe("A follow-up question to deepen understanding"),
        })
        .optional()
        .describe("Only provided when status is 'feedback'"),
    }),
    execute: async (input) => input,
  }),

  progressiveDisclosure: tool({
    description:
      "Structure a multi-layered explanation from simple to nuanced. Use this when explaining complex concepts — start with the simplest mental model and build depth layer by layer, checking readiness before going deeper.",
    inputSchema: z.object({
      concept: z.string().describe("What is being explained"),
      layers: z
        .array(
          z.object({
            level: z.number().describe("Depth level starting at 1"),
            title: z.string().describe("Short title for this level"),
            explanation: z.string().describe("The explanation at this depth"),
            analogy: z
              .string()
              .optional()
              .describe("Optional analogy to make it concrete"),
            readinessQuestion: z
              .string()
              .describe("Question to check before going deeper"),
          }),
        )
        .min(2)
        .max(5)
        .describe("The explanation layers from simple to complex"),
      currentLevel: z.number().default(1).describe("Where the user is now"),
    }),
    execute: async (input) => input,
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
