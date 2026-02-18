import { beforeEach, describe, expect, it } from "vitest";
import {
  _resetOrigins,
  checkCsrf,
  corsHeaders,
  isOriginAllowed,
  preflightResponse,
} from "./cors";

function makeRequest(origin?: string): Request {
  const headers: Record<string, string> = {};
  if (origin) headers.origin = origin;
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers,
  });
}

beforeEach(() => {
  delete process.env.ALLOWED_ORIGIN;
  _resetOrigins();
});

// ── isOriginAllowed ──────────────────────────────────────────────────

describe("isOriginAllowed", () => {
  describe("when ALLOWED_ORIGIN is unset (same-origin only)", () => {
    it("allows null origin (same-origin request)", () => {
      expect(isOriginAllowed(null)).toBe(true);
    });

    it("rejects any explicit origin", () => {
      expect(isOriginAllowed("https://evil.com")).toBe(false);
    });
  });

  describe("when ALLOWED_ORIGIN is set", () => {
    beforeEach(() => {
      process.env.ALLOWED_ORIGIN =
        "https://example.com,https://staging.example.com";
      _resetOrigins();
    });

    it("allows a listed origin", () => {
      expect(isOriginAllowed("https://example.com")).toBe(true);
    });

    it("allows another listed origin", () => {
      expect(isOriginAllowed("https://staging.example.com")).toBe(true);
    });

    it("rejects an unlisted origin", () => {
      expect(isOriginAllowed("https://evil.com")).toBe(false);
    });

    it("rejects null origin when allow-list is configured", () => {
      expect(isOriginAllowed(null)).toBe(false);
    });
  });

  describe("when ALLOWED_ORIGIN has whitespace/trailing commas", () => {
    beforeEach(() => {
      process.env.ALLOWED_ORIGIN = " https://a.com , https://b.com , ";
      _resetOrigins();
    });

    it("trims whitespace and ignores empty entries", () => {
      expect(isOriginAllowed("https://a.com")).toBe(true);
      expect(isOriginAllowed("https://b.com")).toBe(true);
    });
  });
});

// ── corsHeaders ──────────────────────────────────────────────────────

describe("corsHeaders", () => {
  describe("when ALLOWED_ORIGIN is unset", () => {
    it("returns empty object for null origin", () => {
      expect(corsHeaders(null)).toEqual({});
    });

    it("echoes explicit origin (CSRF check is the actual gatekeeper)", () => {
      // With no allow-list, corsHeaders echoes any non-null origin.
      // The CSRF check (checkCsrf) is what blocks cross-origin requests.
      const headers = corsHeaders("https://evil.com");
      expect(headers["Access-Control-Allow-Origin"]).toBe("https://evil.com");
    });
  });

  describe("when ALLOWED_ORIGIN is set", () => {
    beforeEach(() => {
      process.env.ALLOWED_ORIGIN = "https://myapp.com";
      _resetOrigins();
    });

    it("returns CORS headers for a matching origin", () => {
      const headers = corsHeaders("https://myapp.com");
      expect(headers["Access-Control-Allow-Origin"]).toBe("https://myapp.com");
      expect(headers["Access-Control-Allow-Methods"]).toBe("POST, OPTIONS");
      expect(headers["Access-Control-Allow-Headers"]).toContain("Content-Type");
      expect(headers["Access-Control-Allow-Headers"]).toContain(
        "Authorization",
      );
      expect(headers["Access-Control-Max-Age"]).toBe("86400");
      expect(headers.Vary).toBe("Origin");
    });

    it("returns empty object for a non-matching origin", () => {
      expect(corsHeaders("https://evil.com")).toEqual({});
    });

    it("returns empty object for null origin", () => {
      expect(corsHeaders(null)).toEqual({});
    });
  });
});

// ── checkCsrf ────────────────────────────────────────────────────────

describe("checkCsrf", () => {
  describe("when ALLOWED_ORIGIN is unset", () => {
    it("passes for same-origin request (no Origin header)", () => {
      const result = checkCsrf(makeRequest());
      expect(result).toBeNull();
    });

    it("passes for same-origin request with Origin header", () => {
      const req = new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { origin: "http://localhost" },
      });
      const result = checkCsrf(req);
      expect(result).toBeNull();
    });

    it("blocks cross-origin request", async () => {
      const result = checkCsrf(makeRequest("https://evil.com"));
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
      const body = await result?.json();
      expect(body.error).toMatch(/origin not allowed/);
    });
  });

  describe("when ALLOWED_ORIGIN is set", () => {
    beforeEach(() => {
      process.env.ALLOWED_ORIGIN = "https://myapp.com";
      _resetOrigins();
    });

    it("passes for an allowed origin", () => {
      const result = checkCsrf(makeRequest("https://myapp.com"));
      expect(result).toBeNull();
    });

    it("passes for true same-origin requests not in ALLOWED_ORIGIN", () => {
      const req = new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { origin: "http://localhost" },
      });
      const result = checkCsrf(req);
      expect(result).toBeNull();
    });

    it("blocks a disallowed origin", async () => {
      const result = checkCsrf(makeRequest("https://evil.com"));
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it("blocks requests with no Origin header", async () => {
      const result = checkCsrf(makeRequest());
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });
  });
});

// ── preflightResponse ────────────────────────────────────────────────

describe("preflightResponse", () => {
  describe("when ALLOWED_ORIGIN is unset", () => {
    it("returns 204 for any origin (no allow-list means echo)", () => {
      // With no ALLOWED_ORIGIN, corsHeaders echoes any non-null origin,
      // so preflight succeeds. The CSRF check on POST is the real guard.
      const req = new Request("http://localhost/api/chat", {
        method: "OPTIONS",
        headers: { origin: "https://evil.com" },
      });
      const res = preflightResponse(req);
      expect(res.status).toBe(204);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
        "https://evil.com",
      );
    });

    it("returns 403 when no origin header", () => {
      const req = new Request("http://localhost/api/chat", {
        method: "OPTIONS",
      });
      const res = preflightResponse(req);
      expect(res.status).toBe(403);
    });
  });

  describe("when ALLOWED_ORIGIN is set", () => {
    beforeEach(() => {
      process.env.ALLOWED_ORIGIN = "https://myapp.com";
      _resetOrigins();
    });

    it("returns 204 with CORS headers for allowed origin", () => {
      const req = new Request("http://localhost/api/chat", {
        method: "OPTIONS",
        headers: { origin: "https://myapp.com" },
      });
      const res = preflightResponse(req);
      expect(res.status).toBe(204);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
        "https://myapp.com",
      );
      expect(res.headers.get("Access-Control-Allow-Methods")).toBe(
        "POST, OPTIONS",
      );
    });

    it("returns 403 for disallowed origin", () => {
      const req = new Request("http://localhost/api/chat", {
        method: "OPTIONS",
        headers: { origin: "https://evil.com" },
      });
      const res = preflightResponse(req);
      expect(res.status).toBe(403);
    });
  });
});
