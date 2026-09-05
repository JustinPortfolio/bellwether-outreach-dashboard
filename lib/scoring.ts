/**
 * Transparent 0-100 lead-quality scoring, exactly matching the rubric used
 * by n8n Workflow 02 (Job Signal Analysis) and Workflow 03 (Contact
 * Discovery, which adds the contactability component once a contact is
 * found). Kept here as the single source of truth for the dashboard and
 * for automated tests; the n8n Code nodes re-implement the same rules in
 * JavaScript because n8n Code nodes cannot import external TypeScript
 * modules — keep the two in sync when the rubric changes.
 */

export interface ScoreComponents {
  hiringVolumeScore: number; // 0-30
  specialtyScore: number; // 0-25
  recencyScore: number; // 0-15
  companyFitScore: number; // 0-15
  contactabilityScore: number; // 0-15
}

export interface ScoreResult extends ScoreComponents {
  totalScore: number;
  qualified: boolean;
  autoApprovalEligible: boolean;
}

export interface ScoreInput {
  activeJobCount: number;
  matchingJobCount: number;
  mostRecentPostedAt: string | null; // ISO date
  employeeCount: number | null;
  industry: string | null;
  preferredIndustries: string[]; // lowercased
  hasSeniorHrLeader: boolean;
  hasVerifiedBusinessEmail: boolean;
  hasCompleteRecord: boolean;
  now?: Date;
}

export const DEFAULT_QUALIFICATION_THRESHOLD = 65;
export const DEFAULT_AUTO_APPROVAL_THRESHOLD = 85;

export function hiringVolumePoints(activeJobCount: number): number {
  if (activeJobCount >= 40) return 30;
  if (activeJobCount >= 20) return 26;
  if (activeJobCount >= 10) return 20;
  if (activeJobCount >= 5) return 12;
  return 0;
}

export function specialtyAlignmentPoints(matchingJobCount: number): number {
  if (matchingJobCount >= 10) return 25;
  if (matchingJobCount >= 6) return 21;
  if (matchingJobCount >= 3) return 16;
  if (matchingJobCount >= 1) return 8;
  return 0;
}

export function recencyPoints(mostRecentPostedAt: string | null, now: Date = new Date()): number {
  if (!mostRecentPostedAt) return 0;
  const days = (now.getTime() - new Date(mostRecentPostedAt).getTime()) / 86_400_000;
  if (days <= 7) return 15;
  if (days <= 14) return 12;
  if (days <= 30) return 8;
  if (days <= 45) return 4;
  return 0;
}

export function companyFitPoints(
  employeeCount: number | null,
  industry: string | null,
  preferredIndustries: string[]
): number {
  let points = 0;
  if (employeeCount !== null) {
    if (employeeCount >= 200 && employeeCount <= 750) points += 10;
    else if (employeeCount >= 100 && employeeCount <= 1000) points += 6;
  }
  if (industry && preferredIndustries.includes(industry.toLowerCase())) points += 5;
  return points;
}

export function contactabilityPoints(
  hasSeniorHrLeader: boolean,
  hasVerifiedBusinessEmail: boolean,
  hasCompleteRecord: boolean
): number {
  let points = 0;
  if (hasSeniorHrLeader) points += 7;
  if (hasVerifiedBusinessEmail) points += 5;
  if (hasCompleteRecord) points += 3;
  return points;
}

export function computeLeadScore(
  input: ScoreInput,
  qualificationThreshold: number = DEFAULT_QUALIFICATION_THRESHOLD,
  autoApprovalThreshold: number = DEFAULT_AUTO_APPROVAL_THRESHOLD
): ScoreResult {
  const now = input.now ?? new Date();
  const hiringVolumeScore = hiringVolumePoints(input.activeJobCount);
  const specialtyScore = specialtyAlignmentPoints(input.matchingJobCount);
  const recencyScore = recencyPoints(input.mostRecentPostedAt, now);
  const companyFitScore = companyFitPoints(input.employeeCount, input.industry, input.preferredIndustries);
  const contactabilityScore = contactabilityPoints(
    input.hasSeniorHrLeader,
    input.hasVerifiedBusinessEmail,
    input.hasCompleteRecord
  );
  const totalScore = hiringVolumeScore + specialtyScore + recencyScore + companyFitScore + contactabilityScore;

  return {
    hiringVolumeScore,
    specialtyScore,
    recencyScore,
    companyFitScore,
    contactabilityScore,
    totalScore,
    qualified: totalScore >= qualificationThreshold,
    autoApprovalEligible: totalScore >= autoApprovalThreshold,
  };
}
