import { describe, it, expect } from "vitest";
import { isKillSwitchActive, shouldHaltForKillSwitch, OUTREACH_WORKFLOWS_GATED_BY_KILL_SWITCH } from "../lib/killSwitch";
import { isDryRun, stampTestData } from "../lib/dryRun";
import { isSendingAuthorized } from "../lib/sequenceEligibility";

describe("kill switch", () => {
  it("reads boolean true", () => expect(isKillSwitchActive({ kill_switch_enabled: true })).toBe(true));
  it("reads string 'true' (as stored in jsonb)", () => expect(isKillSwitchActive({ kill_switch_enabled: "true" })).toBe(true));
  it("defaults to inactive when unset", () => expect(isKillSwitchActive({})).toBe(false));

  it("halts every outreach-capable workflow when active", () => {
    for (const wf of OUTREACH_WORKFLOWS_GATED_BY_KILL_SWITCH) {
      expect(shouldHaltForKillSwitch(wf, { kill_switch_enabled: true })).toBe(true);
    }
  });
  it("does not halt monitoring workflows", () => {
    expect(shouldHaltForKillSwitch("06 - Sequence Status Sync", { kill_switch_enabled: true })).toBe(false);
    expect(shouldHaltForKillSwitch("07 - Reply Processing", { kill_switch_enabled: true })).toBe(false);
  });
  it("halts nothing when inactive", () => {
    expect(shouldHaltForKillSwitch("05 - Apollo Sequence Enrollment", { kill_switch_enabled: false })).toBe(false);
  });
});

describe("dry run", () => {
  it("defaults to dry-run ON when unset (fail safe)", () => {
    expect(isDryRun({})).toBe(true);
  });
  it("is off only when explicitly false", () => {
    expect(isDryRun({ dry_run: false })).toBe(false);
    expect(isDryRun({ dry_run: "false" })).toBe(false);
  });
  it("stays on for any other value", () => {
    expect(isDryRun({ dry_run: true })).toBe(true);
    expect(isDryRun({ dry_run: "true" })).toBe(true);
    expect(isDryRun({ dry_run: null })).toBe(true);
  });
  it("stamps records with is_test_data matching the dry-run state", () => {
    expect(stampTestData({ name: "Acme" }, true)).toEqual({ name: "Acme", is_test_data: true });
    expect(stampTestData({ name: "Acme" }, false)).toEqual({ name: "Acme", is_test_data: false });
  });
});

describe("isSendingAuthorized", () => {
  const base = { killSwitchEnabled: false, dryRun: false, productionSendingEnabled: true, approvalStatus: "approved" };
  it("authorizes only when every gate passes", () => {
    expect(isSendingAuthorized(base)).toBe(true);
  });
  it("blocks when the kill switch is on", () => {
    expect(isSendingAuthorized({ ...base, killSwitchEnabled: true })).toBe(false);
  });
  it("blocks when dry-run is on", () => {
    expect(isSendingAuthorized({ ...base, dryRun: true })).toBe(false);
  });
  it("blocks when production sending is not enabled", () => {
    expect(isSendingAuthorized({ ...base, productionSendingEnabled: false })).toBe(false);
  });
  it("blocks when the item is not approved", () => {
    expect(isSendingAuthorized({ ...base, approvalStatus: "pending" })).toBe(false);
  });
});
