import { z } from "zod";

/**
 * Zod schema for the Anthropic personalization output (Workflow 04) and the
 * email-content validation rules that must pass before anything can enter
 * the approval queue as 'pending'/'approved' rather than
 * 'regenerate_requested'.
 */

export const AiPersonalizationOutputSchema = z.object({
  subject_line: z.string().min(1),
  opening_line: z.string().min(1),
  email_body: z.string().min(1),
  hiring_signal_summary: z.string().min(1),
  representative_roles: z.array(z.string()),
  personalization_facts: z.array(z.string()),
  call_to_action: z.string().min(1),
  confidence_score: z.number().min(0).max(1),
  missing_information: z.array(z.string()),
  compliance_flags: z.array(z.string()),
});

export type AiPersonalizationOutput = z.infer<typeof AiPersonalizationOutputSchema>;

export const MIN_CONFIDENCE = 0.85;
export const MIN_WORDS = 60;
export const MAX_WORDS = 110;

export const FORBIDDEN_SUBJECT_PATTERNS = [
  /\bre:\s/i,
  /\bfwd:\s/i,
  /act now/i,
  /limited time/i,
  /don't miss/i,
  /we noticed you personally (posted|created)/i,
  /i see we have a mutual/i,
];

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function countLinks(text: string): number {
  return (text.match(/https?:\/\//g) || []).length;
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
}

/**
 * Full validation pipeline: schema shape + word count + forbidden patterns
 * + link count + confidence threshold. Anything failing this MUST route to
 * 'regenerate_requested', never to the send-eligible approval queue.
 */
export function validateAiOutput(raw: unknown, minWords = MIN_WORDS, maxWords = MAX_WORDS, minConfidence = MIN_CONFIDENCE): ValidationResult {
  const issues: string[] = [];
  const parsed = AiPersonalizationOutputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      isValid: false,
      issues: parsed.error.issues.map((i: z.ZodIssue) => `${i.path.join(".")}: ${i.message}`),
    };
  }
  const data = parsed.data;

  const words = wordCount(data.email_body);
  if (words < minWords || words > maxWords) {
    issues.push(`email_body word count ${words} outside ${minWords}-${maxWords}`);
  }

  if (FORBIDDEN_SUBJECT_PATTERNS.some((re) => re.test(data.subject_line))) {
    issues.push("subject_line contains a disallowed pattern (fake urgency or misleading Re:/Fwd:)");
  }

  const links = countLinks(data.email_body);
  if (links > 1) {
    issues.push("email_body contains more than one link");
  }

  if (data.confidence_score < minConfidence) {
    issues.push(`confidence_score ${data.confidence_score} is below the minimum ${minConfidence}`);
  }

  return { isValid: issues.length === 0, issues };
}
