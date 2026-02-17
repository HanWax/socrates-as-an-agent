import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

export function getModel() {
  const provider = process.env.MODEL_PROVIDER ?? "anthropic";

  switch (provider) {
    case "openai":
      return openai("gpt-4o");
    case "anthropic":
      return anthropic("claude-sonnet-4-5-20250929");
    default:
      throw new Error(`Unknown MODEL_PROVIDER: ${provider}`);
  }
}
