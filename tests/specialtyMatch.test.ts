import { describe, it, expect } from "vitest";
import { classifySpecialty, classifySeniority, normalizedJobFamily, DEFAULT_SPECIALTY_KEYWORDS } from "../lib/specialtyMatch";

describe("classifySpecialty", () => {
  it("matches an accounting title", () => {
    expect(classifySpecialty("Senior Accountant")).toBe("Accounting and Finance");
  });
  it("matches an underwriting title", () => {
    expect(classifySpecialty("Commercial Lines Underwriter")).toBe("Insurance Underwriting");
  });
  it("matches an IT title", () => {
    expect(classifySpecialty("Help Desk Technician")).toBe("Information Technology");
  });
  it("returns null for an unrelated title", () => {
    expect(classifySpecialty("Warehouse Forklift Operator")).toBeNull();
  });
  it("is case-insensitive", () => {
    expect(classifySpecialty("SENIOR AUDITOR")).toBe("Audit");
  });
  it("respects a custom keyword map", () => {
    const custom = { Custom: ["widget"] };
    expect(classifySpecialty("Widget Engineer", custom)).toBe("Custom");
    expect(classifySpecialty("Senior Accountant", custom)).toBeNull();
  });
  it("covers every declared specialty with at least one real match", () => {
    for (const [specialty, keywords] of Object.entries(DEFAULT_SPECIALTY_KEYWORDS)) {
      expect(classifySpecialty(keywords[0])).toBe(specialty);
    }
  });
});

describe("classifySeniority", () => {
  it("detects executive titles", () => expect(classifySeniority("Chief Financial Officer")).toBe("executive"));
  it("detects VP titles", () => expect(classifySeniority("VP of Talent Acquisition")).toBe("vp"));
  it("detects director titles", () => expect(classifySeniority("Director of Recruiting")).toBe("director"));
  it("detects manager titles", () => expect(classifySeniority("Recruiting Manager")).toBe("manager"));
  it("detects senior titles", () => expect(classifySeniority("Senior Accountant")).toBe("senior"));
  it("defaults to individual_contributor", () => expect(classifySeniority("Accountant")).toBe("individual_contributor"));
});

describe("normalizedJobFamily", () => {
  it("slugifies a specialty", () => expect(normalizedJobFamily("Accounting and Finance")).toBe("accounting_and_finance"));
  it("returns other for null", () => expect(normalizedJobFamily(null)).toBe("other"));
});
