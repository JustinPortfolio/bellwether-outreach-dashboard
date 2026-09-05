import { describe, it, expect } from "vitest";
import { isSuppressed, containsStopKeyword } from "../lib/suppression";

describe("isSuppressed", () => {
  const rows = [
    { level: "contact_email" as const, value: "jane@acme.com" },
    { level: "company_domain" as const, value: "beta.com" },
  ];

  it("matches on email case-insensitively", () => {
    expect(isSuppressed(rows, { email: "Jane@Acme.com" })).toBe(true);
  });
  it("matches on domain", () => {
    expect(isSuppressed(rows, { domain: "BETA.com" })).toBe(true);
  });
  it("returns false when nothing matches", () => {
    expect(isSuppressed(rows, { email: "bob@gamma.com", domain: "gamma.com" })).toBe(false);
  });
  it("global suppression always wins", () => {
    const globalRows = [{ level: "global" as const, value: "*" }];
    expect(isSuppressed(globalRows, { email: "anyone@anywhere.com" })).toBe(true);
  });
  it("matches organization-level suppression by id", () => {
    const orgRows = [{ level: "company" as const, value: "org-123" }];
    expect(isSuppressed(orgRows, { organizationId: "org-123" })).toBe(true);
    expect(isSuppressed(orgRows, { organizationId: "org-999" })).toBe(false);
  });
});

describe("containsStopKeyword", () => {
  it("detects common opt-out phrasing", () => {
    expect(containsStopKeyword("Please STOP emailing me")).toBe(true);
    expect(containsStopKeyword("Take me off this list")).toBe(true);
    expect(containsStopKeyword("Do not contact me again")).toBe(true);
    expect(containsStopKeyword("unsubscribe please")).toBe(true);
  });
  it("does not false-positive on unrelated text", () => {
    expect(containsStopKeyword("Thanks, this looks interesting, let's talk")).toBe(false);
  });
});
