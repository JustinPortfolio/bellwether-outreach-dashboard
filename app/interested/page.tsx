import { getServerSupabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

async function getInterestedLeads() {
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from("replies")
    .select(
      "id, classification, received_at, organizations(id, name, website_url), contacts(first_name, last_name, email, title)"
    )
    .in("classification", ["interested", "wants_meeting", "wants_information"])
    .order("received_at", { ascending: false })
    .limit(200);
  return data ?? [];
}

export default async function InterestedLeadsPage() {
  const rows = await getInterestedLeads();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Interested Leads</h1>
        <p className="text-sm text-muted-foreground">
          Replies classified interested, wants_meeting, or wants_information — the system's primary success metric.
        </p>
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Company</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Classification</th>
              <th className="p-3">Received</th>
              <th className="p-3">Website</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium">{r.organizations?.name}</td>
                <td className="p-3">
                  {r.contacts?.first_name} {r.contacts?.last_name} ({r.contacts?.title})
                </td>
                <td className="p-3">
                  <Badge tone="success">{r.classification}</Badge>
                </td>
                <td className="p-3">{new Date(r.received_at).toLocaleDateString()}</td>
                <td className="p-3">
                  {r.organizations?.website_url ? (
                    <a className="text-primary underline" href={r.organizations.website_url} target="_blank" rel="noreferrer">
                      Visit
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
