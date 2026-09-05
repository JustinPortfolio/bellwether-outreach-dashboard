import { describe, it, expect } from "vitest";
import { normalizeDomain, dedupeByDomain, isKnownDomain, isInCooldown, isTerminalStatus } from "../lib/dedup";

describe("normalizeDomain", () => {
  it("strips protocol and www", () => expect(normalizeDomain("https://www.Acme.com/careers")).toBe("acme.com"));
  it("handles bare domains", () => expect(normalizeDomain("acme.com")).toBe("acme.com"));
  it("returns null for empty input", () => expect(normalizeDomain(null)).toBeNull());
  it("lowercases", () => expect(normalizeDomain("HTTPS://ACME.COM")).toBe("acme.com"));
});

describe("dedupeByDomain", () => {
  it("removes duplicate domains within a batch, keeping the first", () => {
    const items = [
      { domain: "acme.com", name: "Acme A" },
      { domain: "www.acme.com", name: "Acme B (dup)" },
      { domain: "beta.com", name: "Beta" },
    ];
    const result = dedupeByDomain(items);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.name)).toEqual(["Acme A", "Beta"]);
  });
  it("drops items with no identifiable domain", () => {
    const items = [{ domain: null }, { domain: "acme.com" }];
    expect(dedupeByDomain(items)).toHaveLength(1);
  });
});

describe("isKnownDomain / isTerminalStatus / isInCooldown", () => {
  it("treats any existing status as known (domain is the dedupe key)", () => {
    expect(isKnownDomain("discovered")).toBe(true);
    expect(isKnownDomain(null)).toBe(false);
  });
  it("flags terminal statuses", () => {
    expect(isTerminalStatus("client")).toBe(true);
    expect(isTerminalStatus("duplicate")).toBe(true);
    expect(isTerminalStatus("suppressed")).toBe(true);
    expect(isTerminalStatus("qualified")).toBe(false);
  });
  it("computes cooldown correctly", () => {
    const now = new Date("2026-06-01T00:00:00Z");
    expect(isInCooldown({ cooldownUntil: "2026-12-01T00:00:00Z", now })).toBe(true);
    expect(isInCooldown({ cooldownUntil: "2026-01-01T00:00:00Z", now })).toBe(false);
    expect(isInCooldown({ cooldownUntil: null, now })).toBe(false);
  });
});
