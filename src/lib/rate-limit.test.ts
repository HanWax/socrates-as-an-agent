import { beforeEach, describe, expect, it } from "vitest";
import { _resetStore, checkRateLimit, getClientIp } from "./rate-limit";

beforeEach(() => {
  _resetStore();
});

describe("getClientIp", () => {
  it("extracts first IP from x-forwarded-for", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "9.8.7.6" },
    });
    expect(getClientIp(req)).toBe("9.8.7.6");
  });

  it("returns 'unknown' when no IP headers present", () => {
    const req = new Request("http://localhost");
    expect(getClientIp(req)).toBe("unknown");
  });
});

describe("checkRateLimit", () => {
  it("allows requests within the limit", () => {
    const result = checkRateLimit("10.0.0.1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(19);
  });

  it("decrements remaining with each request", () => {
    checkRateLimit("10.0.0.2");
    const result = checkRateLimit("10.0.0.2");
    expect(result.remaining).toBe(18);
  });

  it("blocks when limit is exceeded", () => {
    for (let i = 0; i < 20; i++) {
      checkRateLimit("10.0.0.3");
    }
    const result = checkRateLimit("10.0.0.3");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("tracks IPs independently", () => {
    for (let i = 0; i < 20; i++) {
      checkRateLimit("10.0.0.4");
    }
    const blocked = checkRateLimit("10.0.0.4");
    expect(blocked.allowed).toBe(false);

    const other = checkRateLimit("10.0.0.5");
    expect(other.allowed).toBe(true);
    expect(other.remaining).toBe(19);
  });
});
