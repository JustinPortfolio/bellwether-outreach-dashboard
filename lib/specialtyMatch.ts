/**
 * Classifies a job title into a Bellwether specialty, seniority tier, and a
 * normalized job family. Mirrors the logic in n8n Workflow 02's "Classify
 * Postings + Build Hiring Summary" Code node.
 */

export const BELLWETHER_SPECIALTIES = [
  "Accounting and Finance",
  "Audit",
  "Insurance Underwriting",
  "Actuarial",
  "Data Analytics",
  "Human Resources",
  "Information Technology",
  "Project Management",
  "Operations",
  "Administrative Support",
  "Marketing",
  "Mortgage Operations",
  "Corporate Support",
  "Executive Support",
] as const;

export type BellwetherSpecialty = (typeof BELLWETHER_SPECIALTIES)[number];

export type SpecialtyKeywordMap = Record<string, string[]>;

export const DEFAULT_SPECIALTY_KEYWORDS: SpecialtyKeywordMap = {
  "Accounting and Finance": ["accountant", "accounting", "finance", "controller", "bookkeeper", "payroll"],
  Audit: ["audit", "auditor", "internal audit", "sox"],
  "Insurance Underwriting": ["underwriter", "underwriting"],
  Actuarial: ["actuary", "actuarial"],
  "Data Analytics": ["data analyst", "data scientist", "analytics", "business intelligence", "bi analyst"],
  "Human Resources": ["human resources", "hr generalist", "hr coordinator", "hr business partner"],
  "Information Technology": [
    "software engineer",
    "it support",
    "systems administrator",
    "network engineer",
    "help desk",
    "developer",
    "devops",
  ],
  "Project Management": ["project manager", "program manager", "pmo", "scrum master"],
  Operations: ["operations manager", "operations analyst", "operations coordinator"],
  "Administrative Support": ["administrative assistant", "office manager", "receptionist", "admin coordinator"],
  Marketing: ["marketing manager", "marketing coordinator", "content marketing", "digital marketing", "seo"],
  "Mortgage Operations": ["mortgage processor", "loan officer", "mortgage underwriter", "loan servicing"],
  "Corporate Support": ["office coordinator", "facilities coordinator"],
  "Executive Support": ["executive assistant", "chief of staff", "administrative business partner"],
};

export function classifySpecialty(title: string | null | undefined, keywords: SpecialtyKeywordMap = DEFAULT_SPECIALTY_KEYWORDS): string | null {
  const t = (title || "").toLowerCase();
  for (const [specialty, kws] of Object.entries(keywords)) {
    if (kws.some((k) => t.includes(k.toLowerCase()))) return specialty;
  }
  return null;
}

export type Seniority = "executive" | "vp" | "director" | "manager" | "senior" | "individual_contributor";

export function classifySeniority(title: string | null | undefined): Seniority {
  const t = (title || "").toLowerCase();
  if (/\b(chief|cxo|cfo|coo|ceo|cpo|chro)\b/.test(t)) return "executive";
  if (/\b(vp|vice president)\b/.test(t)) return "vp";
  if (/\b(director|head of)\b/.test(t)) return "director";
  if (/\bmanager\b/.test(t)) return "manager";
  if (/\b(senior|sr\.)\b/.test(t)) return "senior";
  return "individual_contributor";
}

export function normalizedJobFamily(specialty: string | null): string {
  return specialty ? specialty.toLowerCase().replace(/[^a-z0-9]+/g, "_") : "other";
}
