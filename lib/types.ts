export interface Organization {
  id: string;
  name: string;
  domain: string;
  website_url: string | null;
  industry: string | null;
  employee_count: number | null;
  employee_range: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  status: "discovered" | "qualified" | "rejected" | "held" | "suppressed" | "client" | "duplicate";
  rejection_reason: string | null;
  is_test_data: boolean;
  discovered_at: string;
}

export interface OrganizationScore {
  id: string;
  organization_id: string;
  hiring_volume_score: number;
  specialty_score: number;
  recency_score: number;
  company_fit_score: number;
  contactability_score: number;
  total_score: number;
  qualified: boolean;
  auto_approval_eligible: boolean;
  active_job_count: number;
  matching_job_count: number;
  explanation: Record<string, { points: number; max: number; detail: string }>;
  computed_at: string;
}

export interface Contact {
  id: string;
  organization_id: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  email: string | null;
  email_verification_status: string | null;
  is_backup: boolean;
  is_active_in_outreach: boolean;
  status: string;
}

export interface ApprovalQueueItem {
  id: string;
  organization_id: string;
  contact_id: string;
  subject_line: string | null;
  opening_line: string | null;
  email_body: string | null;
  hiring_signal_summary: string | null;
  representative_roles: string[];
  personalization_facts: string[];
  call_to_action: string | null;
  confidence_score: number | null;
  missing_information: string[];
  compliance_flags: string[];
  status: "pending" | "approved" | "edited" | "rejected" | "suppressed" | "regenerate_requested";
  is_test_data: boolean;
  created_at: string;
}

export interface SequenceMembership {
  id: string;
  organization_id: string;
  contact_id: string;
  status: string;
  current_step: number;
  enrolled_at: string;
  last_activity_at: string | null;
  next_scheduled_step_at: string | null;
  stopped_reason: string | null;
}

export interface Reply {
  id: string;
  organization_id: string;
  contact_id: string;
  classification: string | null;
  classification_confidence: number | null;
  requires_human_review: boolean;
  raw_content_sanitized: string | null;
  received_at: string;
}

export interface SuppressionEntry {
  id: string;
  level: string;
  value: string;
  reason: string | null;
  source: string;
  created_at: string;
}

export interface DailyMetric {
  id: string;
  metric_date: string;
  companies_discovered: number;
  companies_qualified: number;
  qualification_rate: number;
  contacts_found: number;
  verified_contacts: number;
  contacts_awaiting_approval: number;
  contacts_approved: number;
  contacts_enrolled: number;
  emails_sent: number;
  replies_count: number;
  positive_replies: number;
  meetings_requested: number;
  unsubscribes: number;
  bounces: number;
  complaints: number;
  errors: number;
}

export interface SystemSetting {
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
}
