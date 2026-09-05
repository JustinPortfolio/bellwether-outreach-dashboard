import crypto from "node:crypto";

/**
 * Deterministic source_event_id builders, matching the hashing scheme used
 * by each n8n workflow's idempotency key so a dashboard-side recomputation
 * (e.g. for a manual backfill script) produces byte-identical keys.
 */

export function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function organizationSourceEventId(domain: string, day: string, endpoint = "mixed_companies.search"): string {
  return sha256Hex(`${endpoint}|${domain}|${day}`);
}

export function sequenceEnrollmentId(apolloSequenceId: string, contactId: string): string {
  return sha256Hex(`${apolloSequenceId}|${contactId}`);
}

export function activityEventId(enrollmentId: string, eventType: string, occurredAt: string): string {
  return sha256Hex(`${enrollmentId}|${eventType}|${occurredAt}`);
}

export function replySourceEventId(source: string, messageId: string): string {
  return sha256Hex(`${source}|${messageId}`);
}

/** Generic helper for de-duplicating a batch of events against a set of
 * already-seen keys, keeping only the first occurrence of each key — used
 * by tests and by any backfill/replay tooling. */
export function dedupeByKey<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
