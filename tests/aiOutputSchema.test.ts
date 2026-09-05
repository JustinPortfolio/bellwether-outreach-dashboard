import { describe, it, expect } from "vitest";
import { validateAiOutput, wordCount, countLinks, MIN_WORDS, MAX_WORDS } from "../lib/aiOutputSchema";

function goodOutput(overrides: Partial<Record<string, unknown>> = {}) {
  const body =
    "I noticed Acme Corp is currently hiring for 6 positions aligned with areas Bellwether supports, " +
    "including Senior Accountant, HR Business Partner, and Data Analyst. Bellwether Staffing Solutions has " +
    "provided permanent, temporary, contract, and temp-to-hire recruiting since 2001. Would it help if I sent " +
    "a short overview of how we could support the roles creating the most hiring pressure for your team? " +
    "Best, Mo, Bellwether Staffing Solutions.";
  return {
    subject_line: "Support for Acme Corp's current hiring",
    opening_line: "I noticed Acme Corp is currently hiring for 6 positions.",
    email_body: body,
    hiring_signal_summary: "Acme Corp has 6 active openings including 3 accounting roles.",
    representative_roles: ["Senior Accountant", "HR Business Partner", "Data Analyst"],
    personalization_facts: ["6 active openings", "3 accounting roles"],
    call_to_action: "Would it help if I sent a short overview?",
    confidence_score: 0.9,
    missing_information: [],
    compliance_flags: [],
    ...overrides,
  };
}

describe("wordCount / countLinks", () => {
  it("counts words correctly", () => expect(wordCount("one two three")).toBe(3));
  it("counts links correctly", () => expect(countLinks("see https://a.com and https://b.com")).toBe(2));
});

describe("validateAiOutput", () => {
  it("accepts a well-formed, in-range email", () => {
    const result = validateAiOutput(goodOutput());
    expect(result.isValid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("rejects missing required fields", () => {
    const { subject_line, ...rest } = goodOutput();
    const result = validateAiOutput(rest);
    expect(result.isValid).toBe(false);
  });

  it("rejects email_body that is too short", () => {
    const result = validateAiOutput(goodOutput({ email_body: "Too short." }));
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.includes("word count"))).toBe(true);
  });

  it("rejects email_body that is too long", () => {
    const longBody = new Array(MAX_WORDS + 50).fill("word").join(" ");
    const result = validateAiOutput(goodOutput({ email_body: longBody }));
    expect(result.isValid).toBe(false);
  });

  it("rejects confidence below 0.85", () => {
    const result = validateAiOutput(goodOutput({ confidence_score: 0.5 }));
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.includes("confidence_score"))).toBe(true);
  });

  it("rejects a misleading Re:/Fwd: subject line", () => {
    const result = validateAiOutput(goodOutput({ subject_line: "Re: quick question" }));
    expect(result.isValid).toBe(false);
  });

  it("rejects more than one link in the email body", () => {
    const body = goodOutput().email_body + " https://a.com https://b.com";
    const result = validateAiOutput(goodOutput({ email_body: body }));
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.includes("more than one link"))).toBe(true);
  });

  it("surfaces missing_information without failing schema validation on its own", () => {
    const result = validateAiOutput(goodOutput({ missing_information: ["exact department name"] }));
    expect(result.isValid).toBe(true); // missing_information is informational, not a rejection by itself
  });

  it(`enforces the ${MIN_WORDS}-${MAX_WORDS} word window exactly at the boundaries`, () => {
    const minBody = new Array(MIN_WORDS).fill("word").join(" ");
    const maxBody = new Array(MAX_WORDS).fill("word").join(" ");
    expect(validateAiOutput(goodOutput({ email_body: minBody, subject_line: "Hiring update for Acme" })).issues.some((i) => i.includes("word count"))).toBe(false);
    expect(validateAiOutput(goodOutput({ email_body: maxBody, subject_line: "Hiring update for Acme" })).issues.some((i) => i.includes("word count"))).toBe(false);
  });
});
