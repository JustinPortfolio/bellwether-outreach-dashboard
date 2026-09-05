/**
 * Suppression checking. Mirrors the checks performed before every
 * discovery insert (Workflow 01), contact enrichment (Workflow 03), and
 * sequence enrollment (Workflow 05).
 */

export type SuppressionLevel = "contact_email" | "company_domain" | "company" | "organization_category" | "global";

export interface SuppressionRow {
  level: SuppressionLevel;
  value: string;
}

export interface SuppressionCheckInput {
  email?: string | null;
  domain?: string | null;
  organizationId?: string | null;
  category?: string | null;
}

/** Returns true if any of the given identifiers match an active suppression
 * row. Global ('*') suppression always wins. Comparisons are
 * case-insensitive for email/domain. */
export function isSuppressed(rows: SuppressionRow[], input: SuppressionCheckInput): boolean {
  const lowerEmail = input.email?.toLowerCase();
  const lowerDomain = input.domain?.toLowerCase();

  for (const row of rows) {
    if (row.level === "global" && row.value === "*") return true;
    if (row.level === "contact_email" && lowerEmail && row.value.toLowerCase() === lowerEmail) return true;
    if (row.level === "company_domain" && lowerDomain && row.value.toLowerCase() === lowerDomain) return true;
    if (row.level === "company" && input.organizationId && row.value === input.organizationId) return true;
    if (row.level === "organization_category" && input.category && row.value === input.category) return true;
  }
  return false;
}

export const STOP_KEYWORDS = [
  /\bunsubscribe\b/i,
  /\bstop\b/i,
  /\bremove me\b/i,
  /\bdo not contact\b/i,
  /\btake me off\b/i,
];

/** Detects an explicit stop/unsubscribe request in free-text reply content.
 * Used as a defense-in-depth signal alongside the AI reply classifier
 * (Workflow 07) — it never replaces human review of the full reply. */
export function containsStopKeyword(text: string): boolean {
  return STOP_KEYWORDS.some((re) => re.test(text));
}
