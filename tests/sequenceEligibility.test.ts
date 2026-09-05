import { describe, it, expect } from "vitest";
import { isWithinSendingWindow, isUsFederalHoliday, DEFAULT_SCHEDULE } from "../lib/sequenceEligibility";

describe("isUsFederalHoliday", () => {
  it("recognizes fixed-date holidays", () => {
    expect(isUsFederalHoliday(new Date(2026, 6, 4))).toBe(true); // July 4
    expect(isUsFederalHoliday(new Date(2026, 11, 25))).toBe(true); // Dec 25
  });
  it("recognizes floating holidays", () => {
    // Thanksgiving 2026 is Nov 26 (4th Thursday)
    expect(isUsFederalHoliday(new Date(2026, 10, 26))).toBe(true);
    // Memorial Day 2026 is May 25 (last Monday)
    expect(isUsFederalHoliday(new Date(2026, 4, 25))).toBe(true);
  });
  it("returns false for an ordinary business day", () => {
    expect(isUsFederalHoliday(new Date(2026, 2, 10))).toBe(false); // March 10, 2026 (Tuesday)
  });
});

describe("isWithinSendingWindow", () => {
  it("allows a Tuesday at 10am", () => {
    // 2026-03-10 is a Tuesday
    const d = new Date(2026, 2, 10, 10, 0);
    expect(isWithinSendingWindow(d)).toBe(true);
  });
  it("blocks a Friday even during business hours", () => {
    // 2026-03-13 is a Friday
    const d = new Date(2026, 2, 13, 10, 0);
    expect(isWithinSendingWindow(d)).toBe(false);
  });
  it("blocks a Saturday", () => {
    const d = new Date(2026, 2, 14, 10, 0); // Saturday
    expect(isWithinSendingWindow(d)).toBe(false);
  });
  it("blocks before 9:00 AM", () => {
    const d = new Date(2026, 2, 10, 8, 59);
    expect(isWithinSendingWindow(d)).toBe(false);
  });
  it("blocks after 3:30 PM", () => {
    const d = new Date(2026, 2, 10, 15, 31);
    expect(isWithinSendingWindow(d)).toBe(false);
  });
  it("allows exactly at the boundaries", () => {
    expect(isWithinSendingWindow(new Date(2026, 2, 10, 9, 0))).toBe(true);
    expect(isWithinSendingWindow(new Date(2026, 2, 10, 15, 30))).toBe(true);
  });
  it("blocks a US federal holiday even on an allowed weekday", () => {
    // July 4, 2026 is a Saturday in reality, so use Independence Day observed
    // on a weekday instead: Dec 25, 2026 is a Friday (already excluded), so
    // use Thanksgiving 2026 (Nov 26, a Thursday - an otherwise-allowed day).
    const d = new Date(2026, 10, 26, 10, 0);
    expect(isWithinSendingWindow(d)).toBe(false);
  });
  it("respects a custom schedule", () => {
    const fridayOnly = { ...DEFAULT_SCHEDULE, days: ["fri"] };
    const friday = new Date(2026, 2, 13, 10, 0);
    expect(isWithinSendingWindow(friday, fridayOnly)).toBe(true);
  });
});
