/**
 * Daily/hourly capacity math, matching Workflow 01 (discovery caps) and
 * Workflow 05 (enrollment caps). Always computed from real counts pulled
 * fresh from the database — never an in-memory counter — so caps hold
 * across restarts and repeated manual runs.
 */

export function computeRemainingDiscoveryCapacity(
  perExecutionLimit: number,
  dailyCap: number,
  discoveredToday: number
): number {
  const remainingDailyCap = Math.max(0, dailyCap - discoveredToday);
  return Math.min(perExecutionLimit, remainingDailyCap);
}

export function computeRemainingEnrollmentCapacity(
  maxPerDay: number,
  maxPerHour: number,
  enrolledToday: number,
  enrolledThisHour: number
): number {
  const dailyRemaining = Math.max(0, maxPerDay - enrolledToday);
  const hourlyRemaining = Math.max(0, maxPerHour - enrolledThisHour);
  return Math.min(dailyRemaining, hourlyRemaining);
}

/** Splits a candidate list down to whatever capacity allows, preserving
 * order (oldest/highest-priority first). */
export function takeWithinCapacity<T>(candidates: T[], capacity: number): T[] {
  if (capacity <= 0) return [];
  return candidates.slice(0, capacity);
}
