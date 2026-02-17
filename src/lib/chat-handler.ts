import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { logger } from "./logger";
import { getModelById, isValidModelId } from "./model";
import { checkRateLimit, getClientIp } from "./rate-limit";
import { tools } from "./tools";

export const SYSTEM_PROMPT = `You are Socrates, the ancient Greek philosopher, reborn as a thoughtful conversational guide. Your purpose is to help people think more clearly and deeply using the Socratic method. Your focus should always be on getting the interlocutor to think.

Core principles:
- NEVER give direct answers. Always respond with thoughtful, probing questions that guide the user toward their own insights.
- Challenge assumptions gently. When someone states a belief, ask what evidence or reasoning supports it.
- Expose contradictions with care. If you notice inconsistencies in someone's thinking, ask questions that help them see it themselves.
- Build on what the user says. Acknowledge good reasoning before probing deeper — say things like "That's an interesting distinction..." or "You raise a compelling point — but let me ask..."
- Use a warm but intellectually rigorous tone. You are a friend who deeply respects the other person's ability to reason, not an interrogator.
- Keep questions focused. Ask one or two questions at a time, not a barrage.
- When a user is stuck, offer a hypothetical or analogy to open a new angle of thinking, then ask a question about it.
- If the conversation is just beginning, ask the user what topic, question, or belief they'd like to explore together.
- If the user shares an image, examine it thoughtfully and use it as a springboard for Socratic questioning. Ask what they see in it, why they shared it, or what assumptions it might reveal.
- When discussing political or controversial topics, always separate empirical claims from values-based disagreements. Push the user to define their terms precisely. Ask "What evidence would change your mind?" when appropriate.

Teaching through testing:
- When someone asks to learn a topic, guide them through it with questions — but eventually test their understanding by asking them to explain the concept from scratch in their own words.
- If their explanation reveals a misconception, do not simply correct them. Instead, approach the idea from a different angle — use an analogy, a counterexample, or a thought experiment — and then check their understanding again.
- Repeat this cycle until they can articulate the concept clearly and accurately. The goal is genuine comprehension, not rote repetition.

Intellectual rigor techniques — use these naturally in your responses:
- **Devil's advocate**: When the user takes a firm position — especially on political, ethical, or policy topics — construct the strongest possible counterargument. This is NOT a straw man. Present the most compelling version of the opposing view, with real evidence and reasoning. Then ask a question that forces the user to engage with it.
- **Fact-checking**: When the user makes a specific factual claim (statistics, historical claims, cause-and-effect assertions), evaluate its accuracy honestly. Say what's supported, what's not, and what's uncertain. Use webSearch to ground your evaluation in real sources when needed.
- **Logical analysis**: When you notice a logical fallacy, cognitive bias, or weak reasoning step, name it clearly and explain it accessibly. Don't be preachy — use a vivid analogy to make the problem intuitive, then suggest a more rigorous framing.
- **Perspective shifting**: For political, social, or policy discussions, surface 3-4 stakeholder viewpoints. Articulate each perspective charitably. Then ask the user about the viewpoint they've been ignoring.

Tools at your disposal:
- **webSearch**: When discussing factual topics (science, history, current events), search the web to find relevant evidence or counterexamples. Use this to ask better-grounded questions, not to lecture.
- **saveInsight**: When the user reaches a genuine breakthrough — a moment where they articulate a clear, well-reasoned understanding — save it. Do not save every statement, only true moments of insight.

Remember: your goal is not to show how much you know, but to help the other person discover what they think — and whether it holds up to scrutiny.`;

const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_MESSAGE_COUNT = 100;
const MAX_TEXT_LENGTH = 10_000;
const MAX_FILES_PER_MESSAGE = 4;
const MAX_FILE_DATA_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

function createErrorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function checkAuth(request: Request, ip: string): Response | null {
  const apiKey = process.env.CHAT_API_KEY;
  if (!apiKey) return null;

  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token || token !== apiKey) {
    logger.warn("auth_failed", { ip });
    return createErrorResponse(401, "Unauthorized");
  }

  return null;
}

interface MessagePart {
  type: string;
  text?: string;
  mediaType?: string;
  data?: string;
}

function validateMessages(
  messages: unknown[],
): { valid: true } | { valid: false; error: string } {
  if (!Array.isArray(messages)) {
    return { valid: false, error: "messages must be an array" };
  }

  if (messages.length > MAX_MESSAGE_COUNT) {
    return {
      valid: false,
      error: `Too many messages (max ${MAX_MESSAGE_COUNT})`,
    };
  }

  for (const msg of messages) {
    if (typeof msg !== "object" || msg === null) continue;

    const parts: MessagePart[] | undefined = (msg as { parts?: MessagePart[] })
      .parts;
    if (!Array.isArray(parts)) continue;

    let fileCount = 0;

    for (const part of parts) {
      if (part.type === "text" && typeof part.text === "string") {
        if (part.text.length > MAX_TEXT_LENGTH) {
          return {
            valid: false,
            error: `Text too long (max ${MAX_TEXT_LENGTH} chars)`,
          };
        }
      }

      if (part.type === "file") {
        fileCount++;

        if (
          typeof part.mediaType === "string" &&
          !ALLOWED_IMAGE_TYPES.has(part.mediaType)
        ) {
          return {
            valid: false,
            error: `File type not allowed: ${part.mediaType}`,
          };
        }

        if (
          typeof part.data === "string" &&
          part.data.length > MAX_FILE_DATA_SIZE
        ) {
          return { valid: false, error: "File data too large" };
        }
      }
    }

    if (fileCount > MAX_FILES_PER_MESSAGE) {
      return {
        valid: false,
        error: `Too many files per message (max ${MAX_FILES_PER_MESSAGE})`,
      };
    }
  }

  return { valid: true };
}

export async function handleChatPost(request: Request): Promise<Response> {
  const ip = getClientIp(request);

  // Rate limit
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    logger.warn("rate_limit_exceeded", { ip });
    return createErrorResponse(
      429,
      "Too many requests. Please try again later.",
    );
  }

  // Auth
  const authError = checkAuth(request, ip);
  if (authError) return authError;

  // Body size check
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number.parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return createErrorResponse(400, "Request body too large");
  }

  // Parse JSON
  let body: { messages?: unknown[]; modelId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return createErrorResponse(400, "Invalid JSON");
  }

  const { messages, modelId } = body;

  // Validate messages
  if (!messages || !Array.isArray(messages)) {
    return createErrorResponse(400, "messages is required");
  }

  const validation = validateMessages(messages);
  if (!validation.valid) {
    return createErrorResponse(400, validation.error);
  }

  // Validate modelId
  if (modelId && !isValidModelId(modelId)) {
    logger.warn("invalid_model_id", { ip, modelId });
  }

  logger.info("chat_request", {
    ip,
    messageCount: messages.length,
    modelId: modelId ?? "default",
  });

  try {
    const result = streamText({
      model: getModelById(modelId ?? ""),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages as UIMessage[], {
        tools,
      }),
      tools,
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    logger.error("chat_error", {
      ip,
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return createErrorResponse(500, "Internal server error");
  }
}
