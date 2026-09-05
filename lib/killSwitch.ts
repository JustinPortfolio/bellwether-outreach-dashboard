/**
 * Global "Pause All Outreach" switch. When enabled, every workflow that
 * could create or advance outreach (01, 02, 03, 04, 05) must no-op at its
 * first gate. Read-only/monitoring workflows (00, 06, 07's stop-on-reply
 * path, 08, 09) are intentionally NOT blocked by the kill switch, since
 * stopping monitoring would itself be unsafe.
 */

export const OUTREACH_WORKFLOWS_GATED_BY_KILL_SWITCH = [
  "01 - Company Discovery",
  "02 - Job Signal Analysis",
  "03 - Contact Discovery",
  "04 - Personalization and Approval",
  "05 - Apollo Sequence Enrollment",
] as const;

export function isKillSwitchActive(settings: Record<string, unknown>): boolean {
  const value = settings["kill_switch_enabled"];
  return value === true || value === "true";
}

export function shouldHaltForKillSwitch(workflowName: string, settings: Record<string, unknown>): boolean {
  if (!isKillSwitchActive(settings)) return false;
  return (OUTREACH_WORKFLOWS_GATED_BY_KILL_SWITCH as readonly string[]).includes(workflowName);
}
