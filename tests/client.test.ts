import { describe, it, expect, beforeEach, vi } from "vitest";
import { stripGerritPrefix } from "../src/utils/parsing.js";

describe("stripGerritPrefix", () => {
  it("strips the Gerrit magic prefix", () => {
    expect(stripGerritPrefix(")]}'\n[]")).toBe("\n[]");
  });

  it("handles text without prefix", () => {
    expect(stripGerritPrefix('{"key":"value"}')).toBe('{"key":"value"}');
  });

  it("handles empty string", () => {
    expect(stripGerritPrefix("")).toBe("");
  });

  it("handles prefix followed by JSON", () => {
    expect(stripGerritPrefix(")]}'\n{\"result\":true}")).toBe('\n{"result":true}');
  });
});

describe("GerritClient", () => {
  let GerritClient: typeof import("../src/gerrit/client.js").GerritClient;

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("GERRIT_URL", "https://gerrit.example.com");
    vi.stubEnv("GERRIT_USERNAME", "testuser");
    vi.stubEnv("GERRIT_PASSWORD", "testpass");
  });

  it("constructs with env credentials", async () => {
    const mod = await import("../src/gerrit/client.js");
    const client = new mod.GerritClient();
    expect(client.getBaseUrl()).toBe("https://gerrit.example.com");
  });

  it("strips trailing slash from base URL", async () => {
    vi.stubEnv("GERRIT_URL", "https://gerrit.example.com/");
    const mod = await import("../src/gerrit/client.js");
    const client = new mod.GerritClient();
    expect(client.getBaseUrl()).toBe("https://gerrit.example.com");
  });

  it("throws when GERRIT_URL is missing", async () => {
    vi.stubEnv("GERRIT_URL", "");
    await expect(async () => {
      const mod = await import("../src/gerrit/client.js");
      new mod.GerritClient();
    }).rejects.toThrow("GERRIT_URL");
  });

  it("throws when credentials are missing", async () => {
    vi.stubEnv("GERRIT_USERNAME", "");
    vi.stubEnv("GERRIT_PASSWORD", "");
    await expect(async () => {
      const mod = await import("../src/gerrit/client.js");
      new mod.GerritClient();
    }).rejects.toThrow();
  });

  it("makes GET requests with auth header", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('{"status":"ok"}'),
    });
    vi.stubGlobal("fetch", mockFetch);

    const mod = await import("../src/gerrit/client.js");
    const client = new mod.GerritClient();
    await client.get("/changes/");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://gerrit.example.com/a/changes/",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /),
          Accept: "application/json",
        }),
      }),
    );
  });

  it("strips Gerrit prefix from responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(")]}'\n[{\"id\":\"test\"}]"),
      }),
    );

    const mod = await import("../src/gerrit/client.js");
    const client = new mod.GerritClient();
    const result = await client.get("/changes/");

    expect(result).toEqual([{ id: "test" }]);
  });

  it("makes POST requests with JSON body", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(")]}'\n{\"result\":\"created\"}"),
    });
    vi.stubGlobal("fetch", mockFetch);

    const mod = await import("../src/gerrit/client.js");
    const client = new mod.GerritClient();
    await client.post("/changes/123/review", { message: "LGTM" });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://gerrit.example.com/a/changes/123/review",
      expect.objectContaining({
        method: "POST",
        body: '{"message":"LGTM"}',
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("throws on non-ok responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: () => Promise.resolve("Not found"),
      }),
    );

    const mod = await import("../src/gerrit/client.js");
    const client = new mod.GerritClient();

    await expect(client.get("/changes/nonexistent")).rejects.toThrow(
      "Gerrit API error",
    );
  });
});
