import { getServerSupabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

async function getMeetingRequests() {
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from("replies")
    .select("id, received_at, raw_content_sanitized, organizations(name), contacts(first_name, last_name, email, title)")
    .eq("classification", "wants_meeting")
    .order("received_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

export default async function MeetingsPage() {
  const rows = await getMeetingRequests();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Meetings</h1>
        <p className="text-sm text-muted-foreground">Replies classified as wants_meeting — ready for Mo to schedule.</p>
      </div>
      <div className="space-y-3">
        {rows.map((r: any) => (
          <Card key={r.id}>
            <div className="font-medium">
              {r.organizations?.name} — {r.contacts?.first_name} {r.contacts?.last_name} ({r.contacts?.title})
            </div>
            <div className="text-xs text-muted-foreground">{r.contacts?.email} · {new Date(r.received_at).toLocaleString()}</div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{r.raw_content_sanitized}</p>
          </Card>
        ))}
        {rows.length === 0 ? <Card>No meeting requests yet.</Card> : null}
      </div>
    </div>
  );
}
