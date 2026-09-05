import { describe, it, expect } from "vitest";
import { computeRemainingDiscoveryCapacity, computeRemainingEnrollmentCapacity, takeWithinCapacity } from "../lib/dailyCaps";

describe("computeRemainingDiscoveryCapacity", () => {
  it("caps at the per-execution limit when the daily cap has plenty of room", () => {
    expect(computeRemainingDiscoveryCapacity(100, 300, 0)).toBe(100);
  });
  it("caps at the remaining daily budget when it is the tighter constraint", () => {
    expect(computeRemainingDiscoveryCapacity(100, 300, 250)).toBe(50);
  });
  it("returns 0 once the daily cap is exhausted", () => {
    expect(computeRemainingDiscoveryCapacity(100, 300, 300)).toBe(0);
    expect(computeRemainingDiscoveryCapacity(100, 300, 400)).toBe(0); // never negative
  });
});

describe("computeRemainingEnrollmentCapacity", () => {
  it("respects the daily cap of 25", () => {
    expect(computeRemainingEnrollmentCapacity(25, 5, 20, 0)).toBe(5);
  });
  it("respects the hourly cap of 5", () => {
    expect(computeRemainingEnrollmentCapacity(25, 5, 0, 4)).toBe(1);
  });
  it("returns 0 when either cap is exhausted", () => {
    expect(computeRemainingEnrollmentCapacity(25, 5, 25, 0)).toBe(0);
    expect(computeRemainingEnrollmentCapacity(25, 5, 0, 5)).toBe(0);
  });
  it("takes the tighter of the two constraints", () => {
    expect(computeRemainingEnrollmentCapacity(25, 5, 10, 3)).toBe(2); // hourly (2) < daily (15)
  });
});

describe("takeWithinCapacity", () => {
  it("slices to the given capacity", () => {
    expect(takeWithinCapacity([1, 2, 3, 4], 2)).toEqual([1, 2]);
  });
  it("returns an empty array for zero or negative capacity", () => {
    expect(takeWithinCapacity([1, 2, 3], 0)).toEqual([]);
    expect(takeWithinCapacity([1, 2, 3], -5)).toEqual([]);
  });
  it("returns everything when capacity exceeds the list length", () => {
    expect(takeWithinCapacity([1, 2], 10)).toEqual([1, 2]);
  });
});
