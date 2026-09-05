import { getServerSupabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

async function getReplies() {
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from("replies")
    .select(
      "id, classification, classification_confidence, requires_human_review, raw_content_sanitized, received_at, organizations(name), contacts(first_name, last_name, email)"
    )
    .order("received_at", { ascending: false })
    .limit(200);
  return data ?? [];
}

export default async function RepliesPage() {
  const rows = await getReplies();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Replies</h1>
        <p className="text-sm text-muted-foreground">
          Every reply immediately stops the Apollo sequence for that contact. Reply content is shown here exactly
          as sanitized/stored — never auto-answered.
        </p>
      </div>
      <div className="space-y-3">
        {rows.map((r: any) => (
          <Card key={r.id}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{r.organizations?.name}</div>
                <div className="text-xs text-muted-foreground">
                  {r.contacts?.first_name} {r.contacts?.last_name} ({r.contacts?.email}) ·{" "}
                  {new Date(r.received_at).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2">
                {r.requires_human_review ? <Badge tone="warning">needs review</Badge> : null}
                <Badge tone="primary">{r.classification ?? "pending classification"}</Badge>
              </div>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{r.raw_content_sanitized}</p>
          </Card>
        ))}
        {rows.length === 0 ? <Card>No replies yet.</Card> : null}
      </div>
    </div>
  );
}
