import { z } from "zod";

export const REPLY_CLASSIFICATIONS = [
  "interested",
  "wants_meeting",
  "wants_information",
  "referral_to_other_contact",
  "not_now",
  "not_interested",
  "wrong_person",
  "unsubscribe",
  "out_of_office",
  "automatic_response",
  "unclear",
] as const;

export type ReplyClassification = (typeof REPLY_CLASSIFICATIONS)[number];

export const ReplyClassificationOutputSchema = z.object({
  classification: z.enum(REPLY_CLASSIFICATIONS),
  confidence: z.number().min(0).max(1),
  out_of_office_return_date: z.string().nullable().optional(),
  reasoning: z.string().optional(),
});

export type ReplyClassificationOutput = z.infer<typeof ReplyClassificationOutputSchema>;

export const MIN_CLASSIFICATION_CONFIDENCE = 0.6;

/** Parses a raw AI response, defaulting to 'unclear' on any invalid or
 * out-of-enum value rather than trusting unvalidated model output. */
export function parseClassification(raw: unknown): { classification: ReplyClassification; confidence: number; requiresHumanReview: boolean; outOfOfficeReturnDate: string | null } {
  const parsed = ReplyClassificationOutputSchema.safeParse(raw);
  if (!parsed.success) {
    return { classification: "unclear", confidence: 0, requiresHumanReview: true, outOfOfficeReturnDate: null };
  }
  const { classification, confidence } = parsed.data;
  let returnDate: string | null = null;
  if (classification === "out_of_office" && parsed.data.out_of_office_return_date) {
    const d = new Date(parsed.data.out_of_office_return_date);
    if (!Number.isNaN(d.getTime())) returnDate = d.toISOString().slice(0, 10);
  }
  const requiresHumanReview = classification === "unclear" || confidence < MIN_CLASSIFICATION_CONFIDENCE;
  return { classification, confidence, requiresHumanReview, outOfOfficeReturnDate: returnDate };
}

/** Strips script/style tags and all remaining HTML tags. Used before any
 * reply content is stored or sent to the classifier — inbound email is
 * always untrusted content. */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
