/**
 * Domain normalization + dedup helpers. Domain is the primary organization
 * dedup key everywhere in this system (see database/migrations/0001).
 */

export function normalizeDomain(websiteUrlOrDomain: string | null | undefined): string | null {
  if (!websiteUrlOrDomain) return null;
  try {
    let d = websiteUrlOrDomain
      .trim()
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      .toLowerCase();
    d = d.replace(/^www\./, "");
    return d || null;
  } catch {
    return null;
  }
}

export function dedupeByDomain<T extends { domain?: string | null; website_url?: string | null }>(
  items: T[]
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const domain = normalizeDomain(item.domain ?? item.website_url ?? null);
    if (!domain || seen.has(domain)) continue;
    seen.add(domain);
    out.push(item);
  }
  return out;
}

export interface CooldownCheckInput {
  existingStatus?: string | null;
  cooldownUntil?: string | null; // ISO date
  now?: Date;
}

/** True if a domain is already known at all. Domain is the dedupe key for
 * organizations (see the partial unique index in migration 0001), so any
 * existing record — regardless of status — means "do not re-insert". */
export function isKnownDomain(existingStatus: string | null | undefined): boolean {
  return !!existingStatus;
}

/** True if the organization is still within its post-contact cooldown
 * window and should not be re-approached even if it were otherwise
 * eligible (used by re-qualification flows, not the initial dedupe gate). */
export function isInCooldown(input: CooldownCheckInput): boolean {
  const now = input.now ?? new Date();
  if (!input.cooldownUntil) return false;
  return new Date(input.cooldownUntil) > now;
}

/** True if the existing record's status permanently excludes re-import
 * (client, duplicate, or already suppressed). */
export function isTerminalStatus(existingStatus: string | null | undefined): boolean {
  return !!existingStatus && ["client", "duplicate", "suppressed"].includes(existingStatus);
}
