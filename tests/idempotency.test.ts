import { describe, it, expect } from "vitest";
import {
  organizationSourceEventId,
  sequenceEnrollmentId,
  activityEventId,
  replySourceEventId,
  dedupeByKey,
  sha256Hex,
} from "../lib/idempotency";

describe("event id builders are deterministic", () => {
  it("produces the same hash for the same inputs", () => {
    expect(organizationSourceEventId("acme.com", "2026-01-01")).toBe(organizationSourceEventId("acme.com", "2026-01-01"));
  });
  it("produces different hashes for different inputs", () => {
    expect(organizationSourceEventId("acme.com", "2026-01-01")).not.toBe(organizationSourceEventId("acme.com", "2026-01-02"));
  });
  it("sequence enrollment id is stable per (sequence, contact) pair", () => {
    const a = sequenceEnrollmentId("seq-1", "contact-1");
    const b = sequenceEnrollmentId("seq-1", "contact-1");
    const c = sequenceEnrollmentId("seq-1", "contact-2");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
  it("activity event id changes per event type/time", () => {
    const a = activityEventId("enroll-1", "sent", "2026-01-01T00:00:00Z");
    const b = activityEventId("enroll-1", "opened", "2026-01-01T00:00:00Z");
    expect(a).not.toBe(b);
  });
  it("reply source event id is stable for the same message", () => {
    expect(replySourceEventId("gmail", "msg-1")).toBe(replySourceEventId("gmail", "msg-1"));
  });
  it("sha256Hex returns a 64-char hex string", () => {
    expect(sha256Hex("x")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("dedupeByKey", () => {
  it("re-syncing the same event twice never double-counts it", () => {
    const events = [
      { id: "e1", type: "sent" },
      { id: "e1", type: "sent" }, // re-synced duplicate
      { id: "e2", type: "opened" },
    ];
    const result = dedupeByKey(events, (e) => e.id);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(["e1", "e2"]);
  });
});
