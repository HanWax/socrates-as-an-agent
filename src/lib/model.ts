import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

export interface ModelOption {
  id: string;
  name: string;
  provider: "anthropic" | "openai";
  modelId: string;
}

const MODEL_OPTIONS: ModelOption[] = [
  // { id: "claude-opus-4-6",
  //   name: "Claude Opus 4.6",
  //   provider: "anthropic",
  //   modelId: "claude-opus-4-6-20250929",
  // },
  {
    id: "claude-sonnet-4-5",
    name: "Claude Sonnet 4.5",
    provider: "anthropic",
    modelId: "claude-sonnet-4-5-20250929",
  },
  {
    id: "claude-haiku-3-5",
    name: "Claude Haiku 3.5",
    provider: "anthropic",
    modelId: "claude-haiku-4-5-20251001",
  },
  // Let's add expert open ai model too.
  // {
  //   id: "gpt-4o",
  //   name: "GPT-4o",
  //   provider: "openai",
  //   modelId: "gpt-4o",
  // },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    modelId: "gpt-4o",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    modelId: "gpt-4o-mini",
  },
];

const PROVIDER_ENV_KEYS: Record<string, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
};

export function getAvailableModels(): ModelOption[] {
  return MODEL_OPTIONS.filter(
    (m) => !!process.env[PROVIDER_ENV_KEYS[m.provider]],
  );
}

export function isValidModelId(id: string): boolean {
  if (id === "") return true;
  return MODEL_OPTIONS.some((m) => m.id === id);
}

export function getModelById(id: string) {
  const available = getAvailableModels();
  const match = available.find((m) => m.id === id);
  const model = match ?? available[0];

  if (!model) {
    throw new Error(
      "No model available — set ANTHROPIC_API_KEY or OPENAI_API_KEY",
    );
  }

  switch (model.provider) {
    case "anthropic":
      return anthropic(model.modelId);
    case "openai":
      return openai(model.modelId);
  }
}
