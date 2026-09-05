"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase } from "./supabaseClient";

/**
 * Server actions backing the dashboard's interactive controls. These are
 * the ONLY place in the dashboard that mutate approval_queue, contacts,
 * suppression_list, or system_settings — every mutation also writes an
 * audit_log row.
 */

async function writeAudit(action: string, entityType: string, entityId: string, after: unknown) {
  const supabase = getServerSupabase();
  await supabase.from("audit_log").insert({
    actor_type: "user",
    action,
    entity_type: entityType,
    entity_id: entityId,
    after_state: after,
  });
}

export async function approveApprovalQueueItem(id: string, reviewerId?: string) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("approval_queue")
    .update({ status: "approved", reviewed_by: reviewerId ?? null, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select("contact_id")
    .single();
  if (error) throw error;
  if (data?.contact_id) {
    await supabase.from("contacts").update({ status: "approved" }).eq("id", data.contact_id);
  }
  await writeAudit("approve", "approval_queue", id, { status: "approved" });
  revalidatePath("/approval-queue");
}

export async function rejectApprovalQueueItem(id: string, notes?: string) {
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("approval_queue")
    .update({ status: "rejected", review_notes: notes ?? null, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  await writeAudit("reject", "approval_queue", id, { status: "rejected", notes });
  revalidatePath("/approval-queue");
}

export async function requestRegeneration(id: string, notes?: string) {
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("approval_queue")
    .update({ status: "regenerate_requested", review_notes: notes ?? null })
    .eq("id", id);
  if (error) throw error;
  await writeAudit("regenerate_requested", "approval_queue", id, { notes });
  revalidatePath("/approval-queue");
}

export async function editApprovalQueueItemFields(id: string, subjectLine: string, emailBody: string) {
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("approval_queue")
    .update({ subject_line: subjectLine, email_body: emailBody, status: "edited" })
    .eq("id", id);
  if (error) throw error;
  await writeAudit("edit", "approval_queue", id, { subject_line: subjectLine });
  revalidatePath("/approval-queue");
}

/** Form-friendly wrapper for the "Edit before approving" form (raw
 * FormData), since Next.js server actions bound directly to a <form>
 * receive FormData rather than positional arguments. */
export async function editApprovalQueueItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const subjectLine = String(formData.get("subjectLine") ?? "");
  const emailBody = String(formData.get("emailBody") ?? "");
  if (!id) throw new Error("Missing approval_queue id");
  await editApprovalQueueItemFields(id, subjectLine, emailBody);
}

export async function suppressOrganization(organizationId: string, reason: string) {
  const supabase = getServerSupabase();
  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .select("domain")
    .eq("id", organizationId)
    .single();
  if (orgErr) throw orgErr;

  await supabase.from("suppression_list").upsert(
    { level: "company_domain", value: org.domain, reason, source: "manual" },
    { onConflict: "level,value" }
  );
  await supabase.from("organizations").update({ status: "suppressed" }).eq("id", organizationId);
  await supabase
    .from("sequence_memberships")
    .update({ status: "removed", stopped_reason: "manual suppression" })
    .eq("organization_id", organizationId)
    .in("status", ["enrolled", "scheduled", "active", "paused"]);

  await writeAudit("suppress", "organization", organizationId, { reason });
  revalidatePath("/approval-queue");
  revalidatePath("/suppression");
  revalidatePath("/companies");
}

export async function addManualSuppression(level: string, value: string, reason: string) {
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("suppression_list")
    .upsert({ level, value, reason, source: "manual" }, { onConflict: "level,value" });
  if (error) throw error;
  await writeAudit("suppress", level, value, { reason });
  revalidatePath("/suppression");
}

export async function updateSystemSetting(key: string, value: unknown) {
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("system_settings")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", key);
  if (error) throw error;
  await writeAudit("update_setting", "system_settings", key, { value });
  revalidatePath("/settings");
}

export async function setKillSwitch(enabled: boolean) {
  await updateSystemSetting("kill_switch_enabled", enabled);
}

export async function setProductionSendingEnabled(enabled: boolean) {
  await updateSystemSetting("production_sending_enabled", enabled);
}
