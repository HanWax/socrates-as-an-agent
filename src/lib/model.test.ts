import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn((model: string) => ({ provider: "anthropic", model })),
}));
vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn((model: string) => ({ provider: "openai", model })),
}));

import { getAvailableModels, getModelById, isValidModelId } from "./model";

describe("getAvailableModels", () => {
  const origAnthropic = process.env.ANTHROPIC_API_KEY;
  const origOpenai = process.env.OPENAI_API_KEY;

  afterEach(() => {
    if (origAnthropic === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = origAnthropic;
    if (origOpenai === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = origOpenai;
  });

  it("returns anthropic models when only ANTHROPIC_API_KEY is set", () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    delete process.env.OPENAI_API_KEY;
    const models = getAvailableModels();
    expect(models.every((m) => m.provider === "anthropic")).toBe(true);
    expect(models.length).toBe(2);
  });

  it("returns openai models when only OPENAI_API_KEY is set", () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.OPENAI_API_KEY = "sk-test";
    const models = getAvailableModels();
    expect(models.every((m) => m.provider === "openai")).toBe(true);
    expect(models.length).toBe(2);
  });

  it("returns all models when both keys are set", () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    process.env.OPENAI_API_KEY = "sk-test";
    const models = getAvailableModels();
    expect(models.length).toBe(4);
  });

  it("returns empty array when no keys are set", () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const models = getAvailableModels();
    expect(models.length).toBe(0);
  });
});

describe("getModelById", () => {
  const origAnthropic = process.env.ANTHROPIC_API_KEY;
  const origOpenai = process.env.OPENAI_API_KEY;

  afterEach(() => {
    if (origAnthropic === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = origAnthropic;
    if (origOpenai === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = origOpenai;
  });

  it("returns the correct anthropic model by id", () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const model = getModelById("claude-sonnet-4-5");
    expect(model).toEqual({
      provider: "anthropic",
      model: "claude-sonnet-4-5-20250929",
    });
  });

  it("returns the correct openai model by id", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    const model = getModelById("gpt-4o");
    expect(model).toEqual({ provider: "openai", model: "gpt-4o" });
  });

  it("falls back to first available model for invalid id", () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const model = getModelById("nonexistent");
    expect(model).toEqual({
      provider: "anthropic",
      model: "claude-sonnet-4-5-20250929",
    });
  });

  it("throws when no models are available", () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    expect(() => getModelById("anything")).toThrow("No model available");
  });
});

describe("isValidModelId", () => {
  it("returns true for empty string (default)", () => {
    expect(isValidModelId("")).toBe(true);
  });

  it("returns true for a known model id", () => {
    expect(isValidModelId("gpt-4o")).toBe(true);
  });

  it("returns false for an unknown model id", () => {
    expect(isValidModelId("nonexistent-model")).toBe(false);
  });
});
