import { getServerSupabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { addManualSuppression } from "@/lib/actions";

export const dynamic = "force-dynamic";

async function getSuppressionList() {
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from("suppression_list")
    .select("id, level, value, reason, source, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  return data ?? [];
}

async function addSuppressionFromForm(formData: FormData) {
  "use server";
  const level = String(formData.get("level") ?? "");
  const value = String(formData.get("value") ?? "");
  const reason = String(formData.get("reason") ?? "");
  if (!level || !value) return;
  await addManualSuppression(level, value, reason);
}

export default async function SuppressionPage() {
  const rows = await getSuppressionList();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Suppression List</h1>
        <p className="text-sm text-muted-foreground">
          Permanent. Nothing on this list is ever re-imported, re-enriched, or re-enrolled, and no routine cleanup
          job in this system deletes a row from it.
        </p>
      </div>

      <Card>
        <form action={addSuppressionFromForm} className="flex flex-wrap items-end gap-2 text-sm">
          <div>
            <label className="block text-xs text-muted-foreground">Level</label>
            <select name="level" className="rounded border border-border bg-background p-2">
              <option value="contact_email">contact_email</option>
              <option value="company_domain">company_domain</option>
              <option value="company">company</option>
              <option value="organization_category">organization_category</option>
              <option value="global">global</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground">Value</label>
            <input name="value" required className="rounded border border-border bg-background p-2" placeholder="email, domain, or *" />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-muted-foreground">Reason</label>
            <input name="reason" className="w-full rounded border border-border bg-background p-2" placeholder="Legal/compliance flag, manual request, etc." />
          </div>
          <button type="submit" className="rounded bg-primary/15 px-3 py-2 text-primary hover:bg-primary/25">
            Add suppression
          </button>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Level</th>
              <th className="p-3">Value</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Source</th>
              <th className="p-3">Added</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  <Badge>{r.level}</Badge>
                </td>
                <td className="p-3 font-mono text-xs">{r.value}</td>
                <td className="p-3 text-muted-foreground">{r.reason ?? "—"}</td>
                <td className="p-3">{r.source}</td>
                <td className="p-3">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
