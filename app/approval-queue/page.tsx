import { getServerSupabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  approveApprovalQueueItem,
  rejectApprovalQueueItem,
  requestRegeneration,
  suppressOrganization,
  editApprovalQueueItem,
} from "@/lib/actions";

export const dynamic = "force-dynamic";

async function getQueue() {
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from("approval_queue")
    .select(
      "id, organization_id, contact_id, subject_line, email_body, hiring_signal_summary, confidence_score, missing_information, compliance_flags, status, is_test_data, created_at, organizations(name, website_url), contacts(first_name, last_name, title, email, email_verification_status), organization_scores(total_score, explanation)"
    )
    .in("status", ["pending", "regenerate_requested"])
    .order("created_at", { ascending: true })
    .limit(100);
  return data ?? [];
}

export default async function ApprovalQueuePage() {
  const items = await getQueue();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Approval Queue</h1>
        <p className="text-sm text-muted-foreground">
          Every outreach email requires explicit human approval before it can be enrolled (Workflow 05 also
          independently requires production_sending_enabled=true).
        </p>
      </div>

      {items.length === 0 ? (
        <Card>Nothing waiting for review right now.</Card>
      ) : (
        <div className="space-y-4">
          {items.map((item: any) => (
            <Card key={item.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">
                    {item.organizations?.name} {item.is_test_data ? <Badge tone="warning">test</Badge> : null}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Score {item.organization_scores?.total_score ?? "—"} · Contact: {item.contacts?.first_name}{" "}
                    {item.contacts?.last_name} ({item.contacts?.title}) · {item.contacts?.email} [
                    {item.contacts?.email_verification_status}]
                  </div>
                </div>
                <Badge tone={item.status === "regenerate_requested" ? "warning" : "neutral"}>{item.status}</Badge>
              </div>

              <div className="rounded border border-border p-3 text-sm">
                <div className="font-medium">{item.subject_line}</div>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{item.email_body}</p>
              </div>

              {item.missing_information?.length ? (
                <div className="text-xs text-warning">Missing info: {item.missing_information.join(", ")}</div>
              ) : null}
              {item.compliance_flags?.length ? (
                <div className="text-xs text-destructive">Compliance flags: {item.compliance_flags.join(", ")}</div>
              ) : null}

              <div className="flex flex-wrap gap-2 text-sm">
                <form action={approveApprovalQueueItem.bind(null, item.id, undefined)}>
                  <button className="rounded bg-success/15 px-3 py-1 text-success hover:bg-success/25" type="submit">
                    Approve
                  </button>
                </form>
                <form action={rejectApprovalQueueItem.bind(null, item.id, "Rejected from dashboard")}>
                  <button className="rounded bg-destructive/15 px-3 py-1 text-destructive hover:bg-destructive/25" type="submit">
                    Reject
                  </button>
                </form>
                <form action={requestRegeneration.bind(null, item.id, "Regenerate requested from dashboard")}>
                  <button className="rounded bg-muted px-3 py-1 hover:bg-border" type="submit">
                    Regenerate
                  </button>
                </form>
                <form action={suppressOrganization.bind(null, item.organization_id, "Suppressed from approval queue")}>
                  <button className="rounded bg-destructive/15 px-3 py-1 text-destructive hover:bg-destructive/25" type="submit">
                    Suppress company
                  </button>
                </form>
                {item.organizations?.website_url ? (
                  <a
                    href={item.organizations.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded bg-muted px-3 py-1 hover:bg-border"
                  >
                    Open company website
                  </a>
                ) : null}
              </div>

              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground">Edit before approving</summary>
                <form action={editApprovalQueueItem} className="mt-2 space-y-2">
                  <input type="hidden" name="id" value={item.id} />
                  <input
                    name="subjectLine"
                    defaultValue={item.subject_line}
                    className="w-full rounded border border-border bg-background p-2"
                  />
                  <textarea
                    name="emailBody"
                    defaultValue={item.email_body}
                    rows={5}
                    className="w-full rounded border border-border bg-background p-2"
                  />
                  <button className="rounded bg-primary/15 px-3 py-1 text-primary hover:bg-primary/25" type="submit">
                    Save edits
                  </button>
                </form>
              </details>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
