import { describe, it, expect } from "vitest";
import {
  rankAndSelectCandidates,
  isExcludedTitle,
  tierForEmployeeCount,
  isPreferredForTier,
  priorityIndex,
} from "../lib/contactSelection";

describe("isExcludedTitle", () => {
  it("excludes assistants, interns, consultants, and former employees", () => {
    expect(isExcludedTitle("Assistant to the CEO")).toBe(true);
    expect(isExcludedTitle("HR Intern")).toBe(true);
    expect(isExcludedTitle("HR Consultant")).toBe(true);
    expect(isExcludedTitle("Former VP of HR")).toBe(true);
  });
  it("keeps legitimate titles", () => {
    expect(isExcludedTitle("VP of Human Resources")).toBe(false);
  });
});

describe("tierForEmployeeCount / isPreferredForTier", () => {
  it("classifies small vs large companies at the 250 boundary", () => {
    expect(tierForEmployeeCount(250)).toBe("small");
    expect(tierForEmployeeCount(251)).toBe("large");
  });
  it("prefers HR Director/Manager for small companies", () => {
    expect(isPreferredForTier("HR Director", "small")).toBe(true);
    expect(isPreferredForTier("VP of Talent Acquisition", "small")).toBe(false);
  });
  it("prefers VP/Director for large companies", () => {
    expect(isPreferredForTier("VP of Talent Acquisition", "large")).toBe(true);
    expect(isPreferredForTier("Recruiting Coordinator", "large")).toBe(false);
  });
});

describe("priorityIndex", () => {
  it("ranks CHRO above a generic recruiter", () => {
    expect(priorityIndex("Chief Human Resources Officer")).toBeLessThan(priorityIndex("Corporate Recruiter"));
  });
});

describe("rankAndSelectCandidates", () => {
  it("selects at most two candidates", () => {
    const candidates = Array.from({ length: 5 }, (_, i) => ({
      apolloContactId: `id-${i}`,
      title: "Recruiting Manager",
    }));
    expect(rankAndSelectCandidates(candidates, 500, null)).toHaveLength(2);
  });

  it("prefers the tier-appropriate title for a small company", () => {
    const candidates = [
      { apolloContactId: "1", title: "Corporate Recruiter" },
      { apolloContactId: "2", title: "HR Director" },
    ];
    const result = rankAndSelectCandidates(candidates, 150, null);
    expect(result[0].apolloContactId).toBe("2");
  });

  it("prefers candidates near HQ when priority is tied", () => {
    const candidates = [
      { apolloContactId: "far", title: "Recruiting Manager", state: "CA" },
      { apolloContactId: "near", title: "Recruiting Manager", state: "NY" },
    ];
    const result = rankAndSelectCandidates(candidates, 500, "NY");
    expect(result[0].apolloContactId).toBe("near");
  });

  it("excludes interns/assistants/consultants entirely", () => {
    const candidates = [
      { apolloContactId: "1", title: "HR Intern" },
      { apolloContactId: "2", title: "HR Manager" },
    ];
    const result = rankAndSelectCandidates(candidates, 200, null);
    expect(result.map((r) => r.apolloContactId)).toEqual(["2"]);
  });

  it("prefers currently-employed candidates when otherwise tied", () => {
    const candidates = [
      { apolloContactId: "former", title: "Recruiting Manager", currentlyEmployed: false },
      { apolloContactId: "current", title: "Recruiting Manager", currentlyEmployed: true },
    ];
    const result = rankAndSelectCandidates(candidates, 500, null);
    expect(result[0].apolloContactId).toBe("current");
  });
});
