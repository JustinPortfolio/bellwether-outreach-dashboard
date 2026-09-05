import { getServerSupabase } from "@/lib/supabaseClient";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

async function getCompanies() {
  const supabase = getServerSupabase();
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name, industry, employee_count, status, is_test_data, discovered_at")
    .order("discovered_at", { ascending: false })
    .limit(200);

  const ids = (orgs ?? []).map((o) => o.id);
  const [{ data: scores }, { data: contacts }, { data: memberships }] = await Promise.all([
    supabase.from("v_latest_organization_scores").select("organization_id, total_score, active_job_count, matching_job_count").in("organization_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("contacts").select("organization_id, first_name, last_name, title, is_active_in_outreach").in("organization_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("sequence_memberships").select("organization_id, status, last_activity_at, next_scheduled_step_at").in("organization_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
  ]);

  const scoreByOrg = new Map((scores ?? []).map((s) => [s.organization_id, s]));
  const contactByOrg = new Map<string, any>();
  for (const c of contacts ?? []) {
    if (c.is_active_in_outreach || !contactByOrg.has(c.organization_id)) contactByOrg.set(c.organization_id, c);
  }
  const membershipByOrg = new Map((memberships ?? []).map((m) => [m.organization_id, m]));

  return (orgs ?? []).map((o) => ({
    ...o,
    score: scoreByOrg.get(o.id),
    contact: contactByOrg.get(o.id),
    membership: membershipByOrg.get(o.id),
  }));
}

export default async function CompaniesPage() {
  const rows = await getCompanies();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Qualified Companies</h1>
        <p className="text-sm text-muted-foreground">All discovered organizations and their current pipeline state.</p>
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Company</th>
              <th className="p-3">Industry</th>
              <th className="p-3">Employees</th>
              <th className="p-3">Active jobs</th>
              <th className="p-3">Matching jobs</th>
              <th className="p-3">Lead score</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Status</th>
              <th className="p-3">Last activity</th>
              <th className="p-3">Next action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium">
                  {r.name} {r.is_test_data ? <Badge tone="warning">test</Badge> : null}
                </td>
                <td className="p-3">{r.industry ?? "—"}</td>
                <td className="p-3">{r.employee_count ?? "—"}</td>
                <td className="p-3">{r.score?.active_job_count ?? "—"}</td>
                <td className="p-3">{r.score?.matching_job_count ?? "—"}</td>
                <td className="p-3">{r.score?.total_score ?? "—"}</td>
                <td className="p-3">
                  {r.contact ? `${r.contact.first_name ?? ""} ${r.contact.last_name ?? ""} — ${r.contact.title ?? ""}` : "—"}
                </td>
                <td className="p-3">
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                </td>
                <td className="p-3">
                  {r.membership?.last_activity_at ? new Date(r.membership.last_activity_at).toLocaleDateString() : "—"}
                </td>
                <td className="p-3 text-muted-foreground">
                  {r.status === "discovered"
                    ? "Awaiting job-signal analysis"
                    : r.status === "qualified" && !r.contact
                    ? "Awaiting contact discovery"
                    : r.status === "qualified" && r.contact
                    ? "Awaiting personalization/approval"
                    : r.membership?.next_scheduled_step_at
                    ? `Next step ${new Date(r.membership.next_scheduled_step_at).toLocaleDateString()}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
