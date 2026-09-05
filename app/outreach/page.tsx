import { getServerSupabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/Card";
import { Badge, statusTone } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

async function getActiveOutreach() {
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from("sequence_memberships")
    .select(
      "id, status, current_step, enrolled_at, last_activity_at, next_scheduled_step_at, stopped_reason, organizations(name), contacts(first_name, last_name, email)"
    )
    .order("enrolled_at", { ascending: false })
    .limit(200);
  return data ?? [];
}

export default async function OutreachPage() {
  const rows = await getActiveOutreach();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Active Outreach</h1>
        <p className="text-sm text-muted-foreground">Live Apollo sequence membership status, synced every 15 minutes.</p>
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Company</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Status</th>
              <th className="p-3">Step</th>
              <th className="p-3">Enrolled</th>
              <th className="p-3">Last activity</th>
              <th className="p-3">Next step</th>
              <th className="p-3">Stopped reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium">{r.organizations?.name}</td>
                <td className="p-3">
                  {r.contacts?.first_name} {r.contacts?.last_name} ({r.contacts?.email})
                </td>
                <td className="p-3">
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                </td>
                <td className="p-3">{r.current_step} / 3</td>
                <td className="p-3">{new Date(r.enrolled_at).toLocaleDateString()}</td>
                <td className="p-3">{r.last_activity_at ? new Date(r.last_activity_at).toLocaleString() : "—"}</td>
                <td className="p-3">{r.next_scheduled_step_at ? new Date(r.next_scheduled_step_at).toLocaleDateString() : "—"}</td>
                <td className="p-3 text-muted-foreground">{r.stopped_reason ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
