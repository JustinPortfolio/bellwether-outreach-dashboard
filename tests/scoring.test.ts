import { describe, it, expect } from "vitest";
import {
  hiringVolumePoints,
  specialtyAlignmentPoints,
  recencyPoints,
  companyFitPoints,
  contactabilityPoints,
  computeLeadScore,
  DEFAULT_QUALIFICATION_THRESHOLD,
  DEFAULT_AUTO_APPROVAL_THRESHOLD,
} from "../lib/scoring";

describe("hiringVolumePoints", () => {
  it("returns 0 below the minimum", () => {
    expect(hiringVolumePoints(4)).toBe(0);
  });
  it("returns 12 for 5-9 jobs", () => {
    expect(hiringVolumePoints(5)).toBe(12);
    expect(hiringVolumePoints(9)).toBe(12);
  });
  it("returns 20 for 10-19 jobs", () => {
    expect(hiringVolumePoints(10)).toBe(20);
    expect(hiringVolumePoints(19)).toBe(20);
  });
  it("returns 26 for 20-39 jobs", () => {
    expect(hiringVolumePoints(20)).toBe(26);
    expect(hiringVolumePoints(39)).toBe(26);
  });
  it("returns 30 for 40+ jobs", () => {
    expect(hiringVolumePoints(40)).toBe(30);
    expect(hiringVolumePoints(1000)).toBe(30);
  });
});

describe("specialtyAlignmentPoints", () => {
  it("returns 0 for no matches", () => expect(specialtyAlignmentPoints(0)).toBe(0));
  it("returns 8 for 1-2 matches", () => {
    expect(specialtyAlignmentPoints(1)).toBe(8);
    expect(specialtyAlignmentPoints(2)).toBe(8);
  });
  it("returns 16 for 3-5 matches", () => {
    expect(specialtyAlignmentPoints(3)).toBe(16);
    expect(specialtyAlignmentPoints(5)).toBe(16);
  });
  it("returns 21 for 6-9 matches", () => {
    expect(specialtyAlignmentPoints(6)).toBe(21);
    expect(specialtyAlignmentPoints(9)).toBe(21);
  });
  it("returns 25 for 10+ matches", () => expect(specialtyAlignmentPoints(10)).toBe(25));
});

describe("recencyPoints", () => {
  const now = new Date("2026-01-31T12:00:00Z");
  it("returns 0 for null date", () => expect(recencyPoints(null, now)).toBe(0));
  it("returns 15 for <=7 days", () => expect(recencyPoints(new Date(now.getTime() - 3 * 86400000).toISOString(), now)).toBe(15));
  it("returns 12 for <=14 days", () => expect(recencyPoints(new Date(now.getTime() - 10 * 86400000).toISOString(), now)).toBe(12));
  it("returns 8 for <=30 days", () => expect(recencyPoints(new Date(now.getTime() - 25 * 86400000).toISOString(), now)).toBe(8));
  it("returns 4 for <=45 days", () => expect(recencyPoints(new Date(now.getTime() - 40 * 86400000).toISOString(), now)).toBe(4));
  it("returns 0 for >45 days", () => expect(recencyPoints(new Date(now.getTime() - 60 * 86400000).toISOString(), now)).toBe(0));
});

describe("companyFitPoints", () => {
  it("gives 10 for the preferred 200-750 band", () => expect(companyFitPoints(500, null, [])).toBe(10));
  it("gives 6 for in-range but outside preferred band", () => expect(companyFitPoints(150, null, [])).toBe(6));
  it("gives 0 for out of range employee counts", () => expect(companyFitPoints(50, null, [])).toBe(0));
  it("adds 5 for a preferred industry", () => expect(companyFitPoints(500, "Insurance", ["insurance"])).toBe(15));
  it("does not add industry points when not preferred", () => expect(companyFitPoints(500, "Retail", ["insurance"])).toBe(10));
});

describe("contactabilityPoints", () => {
  it("sums all three components", () => expect(contactabilityPoints(true, true, true)).toBe(15));
  it("gives 0 when nothing is known", () => expect(contactabilityPoints(false, false, false)).toBe(0));
  it("gives partial credit", () => expect(contactabilityPoints(false, true, false)).toBe(5));
});

describe("computeLeadScore", () => {
  it("qualifies a strong lead and marks it auto-approval eligible", () => {
    const result = computeLeadScore({
      activeJobCount: 25,
      matchingJobCount: 8,
      mostRecentPostedAt: new Date().toISOString(),
      employeeCount: 400,
      industry: "Insurance",
      preferredIndustries: ["insurance"],
      hasSeniorHrLeader: true,
      hasVerifiedBusinessEmail: true,
      hasCompleteRecord: true,
    });
    expect(result.totalScore).toBeGreaterThanOrEqual(DEFAULT_AUTO_APPROVAL_THRESHOLD);
    expect(result.qualified).toBe(true);
    expect(result.autoApprovalEligible).toBe(true);
  });

  it("rejects a weak lead", () => {
    const result = computeLeadScore({
      activeJobCount: 2,
      matchingJobCount: 0,
      mostRecentPostedAt: null,
      employeeCount: 50,
      industry: null,
      preferredIndustries: [],
      hasSeniorHrLeader: false,
      hasVerifiedBusinessEmail: false,
      hasCompleteRecord: false,
    });
    expect(result.totalScore).toBeLessThan(DEFAULT_QUALIFICATION_THRESHOLD);
    expect(result.qualified).toBe(false);
    expect(result.autoApprovalEligible).toBe(false);
  });

  it("respects a custom qualification threshold", () => {
    const input = {
      activeJobCount: 6,
      matchingJobCount: 2,
      mostRecentPostedAt: new Date().toISOString(),
      employeeCount: 300,
      industry: null,
      preferredIndustries: [],
      hasSeniorHrLeader: false,
      hasVerifiedBusinessEmail: false,
      hasCompleteRecord: false,
    };
    const strict = computeLeadScore(input, 90);
    const lenient = computeLeadScore(input, 10);
    expect(strict.qualified).toBe(false);
    expect(lenient.qualified).toBe(true);
  });
});
