/**
 * Sending-window eligibility: Monday-Thursday by default, 9:00 AM-3:30 PM
 * in the contact's local time, never on weekends, never on US federal
 * holidays. Apollo enforces sequence-level scheduling itself, but this
 * logic is used by the dashboard (to show "next eligible send window") and
 * by tests to lock in the rule.
 */

export interface SendingSchedule {
  days: string[]; // e.g. ["mon","tue","wed","thu"]
  startLocalTime: string; // "09:00"
  endLocalTime: string; // "15:30"
  excludeWeekends: boolean;
  excludeUsFederalHolidays: boolean;
}

export const DEFAULT_SCHEDULE: SendingSchedule = {
  days: ["mon", "tue", "wed", "thu"],
  startLocalTime: "09:00",
  endLocalTime: "15:30",
  excludeWeekends: true,
  excludeUsFederalHolidays: true,
};

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// Fixed-date US federal holidays are exact; the floating ones (Thanksgiving,
// MLK Day, Presidents Day, Memorial Day, Labor Day, Columbus Day) are
// resolved by rule below rather than hardcoded per year.
export function isUsFederalHoliday(date: Date): boolean {
  const y = date.getFullYear();
  const m = date.getMonth(); // 0-indexed
  const d = date.getDate();

  const fixed = [
    [0, 1], // New Year's Day
    [5, 19], // Juneteenth
    [6, 4], // Independence Day
    [10, 11], // Veterans Day
    [11, 25], // Christmas Day
  ];
  if (fixed.some(([fm, fd]) => m === fm && d === fd)) return true;

  function nthWeekdayOfMonth(month: number, weekday: number, n: number): number {
    const first = new Date(y, month, 1);
    const firstWeekday = first.getDay();
    const offset = (weekday - firstWeekday + 7) % 7;
    return 1 + offset + (n - 1) * 7;
  }
  function lastWeekdayOfMonth(month: number, weekday: number): number {
    const last = new Date(y, month + 1, 0).getDate();
    const lastDate = new Date(y, month, last);
    const diff = (lastDate.getDay() - weekday + 7) % 7;
    return last - diff;
  }

  if (m === 0 && d === nthWeekdayOfMonth(0, 1, 3)) return true; // MLK Day: 3rd Monday of Jan
  if (m === 1 && d === nthWeekdayOfMonth(1, 1, 3)) return true; // Presidents Day: 3rd Monday of Feb
  if (m === 4 && d === lastWeekdayOfMonth(4, 1)) return true; // Memorial Day: last Monday of May
  if (m === 8 && d === nthWeekdayOfMonth(8, 1, 1)) return true; // Labor Day: 1st Monday of Sep
  if (m === 9 && d === nthWeekdayOfMonth(9, 1, 2)) return true; // Columbus Day: 2nd Monday of Oct
  if (m === 10 && d === nthWeekdayOfMonth(10, 4, 4)) return true; // Thanksgiving: 4th Thursday of Nov

  return false;
}

function parseHm(hm: string): { h: number; m: number } {
  const [h, m] = hm.split(":").map(Number);
  return { h, m };
}

/** Evaluates eligibility against a date that already represents the
 * CONTACT'S LOCAL time (i.e. convert before calling this). */
export function isWithinSendingWindow(localDate: Date, schedule: SendingSchedule = DEFAULT_SCHEDULE): boolean {
  const dayKey = DAY_KEYS[localDate.getDay()];
  if (!schedule.days.includes(dayKey)) return false;
  if (schedule.excludeWeekends && (dayKey === "sat" || dayKey === "sun")) return false;
  if (schedule.excludeUsFederalHolidays && isUsFederalHoliday(localDate)) return false;

  const start = parseHm(schedule.startLocalTime);
  const end = parseHm(schedule.endLocalTime);
  const minutesNow = localDate.getHours() * 60 + localDate.getMinutes();
  const minutesStart = start.h * 60 + start.m;
  const minutesEnd = end.h * 60 + end.m;
  return minutesNow >= minutesStart && minutesNow <= minutesEnd;
}

export interface SequenceCapConfig {
  maxNewContactsPerDay: number;
  maxContactsPerHour: number;
  maxTotalSteps: number;
}

export const DEFAULT_SEQUENCE_CAPS: SequenceCapConfig = {
  maxNewContactsPerDay: 25,
  maxContactsPerHour: 5,
  maxTotalSteps: 3,
};

/** True only if every gate required before ANY Apollo mutation is
 * satisfied. Mirrors Workflow 05's "Production Sending Enabled AND Not
 * Dry-Run?" gate plus the per-contact approval requirement. */
export function isSendingAuthorized(input: {
  killSwitchEnabled: boolean;
  dryRun: boolean;
  productionSendingEnabled: boolean;
  approvalStatus: string;
}): boolean {
  return (
    !input.killSwitchEnabled &&
    !input.dryRun &&
    input.productionSendingEnabled &&
    input.approvalStatus === "approved"
  );
}
