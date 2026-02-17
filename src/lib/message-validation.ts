export const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5 MB
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

export interface MessagePart {
  type: string;
  text?: string;
  mediaType?: string;
  data?: string;
}

export function validateMessageParts(
  parts: unknown,
): { valid: true } | { valid: false; error: string } {
  if (!Array.isArray(parts)) {
    return { valid: false, error: "parts must be an array" };
  }

  let fileCount = 0;

  for (const part of parts) {
    if (part && typeof part === "object") {
      const p = part as MessagePart;
      if (p.type === "text" && typeof p.text === "string") {
        if (p.text.length > MAX_TEXT_LENGTH) {
          return {
            valid: false,
            error: `Text too long (max ${MAX_TEXT_LENGTH} chars)`,
          };
        }
      }

      if (p.type === "file") {
        fileCount++;

        if (typeof p.mediaType === "string" && !ALLOWED_IMAGE_TYPES.has(p.mediaType)) {
          return {
            valid: false,
            error: `File type not allowed: ${p.mediaType}`,
          };
        }

        if (typeof p.data === "string" && p.data.length > MAX_FILE_DATA_SIZE) {
          return { valid: false, error: "File data too large" };
        }
      }
    }
  }

  if (fileCount > MAX_FILES_PER_MESSAGE) {
    return {
      valid: false,
      error: `Too many files per message (max ${MAX_FILES_PER_MESSAGE})`,
    };
  }

  return { valid: true };
}

export function validateMessages(
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
    const parts = (msg as { parts?: unknown }).parts;
    if (!Array.isArray(parts)) continue;

    const validation = validateMessageParts(parts);
    if (!validation.valid) return validation;
  }

  return { valid: true };
}
