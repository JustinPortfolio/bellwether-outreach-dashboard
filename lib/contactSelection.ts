/**
 * Decision-maker ranking + selection logic, mirroring n8n Workflow 03's
 * "Rank + Select Up To Two Candidates" Code node.
 */

export const CONTACT_PRIORITY_TITLES = [
  "Chief Human Resources Officer",
  "Chief People Officer",
  "VP of Human Resources",
  "VP of Talent Acquisition",
  "Head of Talent Acquisition",
  "Head of Recruiting",
  "Director of Talent Acquisition",
  "Director of Recruiting",
  "Human Resources Director",
  "Talent Acquisition Manager",
  "Recruiting Manager",
  "Human Resources Manager",
  "People Operations Director",
  "Corporate Recruiter",
];

const EXCLUDE_TITLE_RE = /\b(assistant to|intern|consultant|former|ex-)\b/i;

export interface RawCandidate {
  apolloContactId: string;
  firstName?: string;
  lastName?: string;
  title: string;
  state?: string | null;
  currentlyEmployed?: boolean;
}

export interface RankedCandidate extends RawCandidate {
  priorityIndex: number;
  preferredForTier: boolean;
  nearHq: boolean;
}

export function priorityIndex(title: string, priorityTitles: string[] = CONTACT_PRIORITY_TITLES): number {
  const t = title.toLowerCase();
  const idx = priorityTitles.findIndex((p) => t.includes(p.toLowerCase()));
  return idx === -1 ? priorityTitles.length : idx;
}

export type SizeTier = "small" | "large";

export function tierForEmployeeCount(count: number | null | undefined): SizeTier {
  return (count ?? 0) <= 250 ? "small" : "large";
}

export function isPreferredForTier(title: string, tier: SizeTier): boolean {
  const t = title.toLowerCase();
  if (tier === "small") {
    return /(hr director|hr manager|head of people|talent acquisition manager|human resources)/.test(t);
  }
  return /(vp|vice president|head of|director)/.test(t);
}

export function isExcludedTitle(title: string | null | undefined): boolean {
  return !title || EXCLUDE_TITLE_RE.test(title);
}

/** Ranks and selects up to two candidates for a company, applying the exact
 * ordering used by Workflow 03: preferred-for-tier first, then priority
 * title order, then proximity to HQ, then currently-employed. */
export function rankAndSelectCandidates(
  candidates: RawCandidate[],
  employeeCount: number | null,
  hqState: string | null,
  priorityTitles: string[] = CONTACT_PRIORITY_TITLES
): RankedCandidate[] {
  const tier = tierForEmployeeCount(employeeCount);
  return candidates
    .filter((c) => !isExcludedTitle(c.title))
    .map((c) => ({
      ...c,
      priorityIndex: priorityIndex(c.title, priorityTitles),
      preferredForTier: isPreferredForTier(c.title, tier),
      nearHq: !!(c.state && hqState && c.state === hqState),
    }))
    .sort((a, b) => {
      if (a.preferredForTier !== b.preferredForTier) return a.preferredForTier ? -1 : 1;
      if (a.priorityIndex !== b.priorityIndex) return a.priorityIndex - b.priorityIndex;
      if (a.nearHq !== b.nearHq) return a.nearHq ? -1 : 1;
      const aEmployed = a.currentlyEmployed !== false;
      const bEmployed = b.currentlyEmployed !== false;
      if (aEmployed !== bEmployed) return aEmployed ? -1 : 1;
      return 0;
    })
    .slice(0, 2);
}
