import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn((model: string) => ({ provider: "anthropic", model })),
}));
vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn((model: string) => ({ provider: "openai", model })),
}));

import { getModel } from "./model";

describe("getModel", () => {
  const originalEnv = process.env.MODEL_PROVIDER;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.MODEL_PROVIDER;
    } else {
      process.env.MODEL_PROVIDER = originalEnv;
    }
  });

  it("returns anthropic model by default when MODEL_PROVIDER is unset", () => {
    delete process.env.MODEL_PROVIDER;
    const model = getModel();
    expect(model).toEqual({
      provider: "anthropic",
      model: "claude-sonnet-4-5-20250929",
    });
  });

  it('returns anthropic model when MODEL_PROVIDER is "anthropic"', () => {
    process.env.MODEL_PROVIDER = "anthropic";
    const model = getModel();
    expect(model).toEqual({
      provider: "anthropic",
      model: "claude-sonnet-4-5-20250929",
    });
  });

  it('returns openai model when MODEL_PROVIDER is "openai"', () => {
    process.env.MODEL_PROVIDER = "openai";
    const model = getModel();
    expect(model).toEqual({ provider: "openai", model: "gpt-4o" });
  });

  it("throws an error for an unknown provider", () => {
    process.env.MODEL_PROVIDER = "gemini";
    expect(() => getModel()).toThrow("Unknown MODEL_PROVIDER: gemini");
  });
});
