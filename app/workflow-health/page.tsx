import { getServerSupabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

async function getWorkflowHealth() {
  const supabase = getServerSupabase();
  const [{ data: runs }, { data: errors }] = await Promise.all([
    supabase.from("workflow_runs").select("*").order("started_at", { ascending: false }).limit(50),
    supabase.from("error_log").select("*").order("occurred_at", { ascending: false }).limit(50),
  ]);
  return { runs: runs ?? [], errors: errors ?? [] };
}

export default async function WorkflowHealthPage() {
  const { runs, errors } = await getWorkflowHealth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Workflow Health</h1>
        <p className="text-sm text-muted-foreground">
          Recent n8n execution history and errors. Run "00 - System Health Check" manually any time for a live
          integration status report.
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Recent runs</h2>
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Workflow</th>
                <th className="p-3">Status</th>
                <th className="p-3">Dry run</th>
                <th className="p-3">Started</th>
                <th className="p-3">Processed / OK / Failed</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="p-3">{r.workflow_name}</td>
                  <td className="p-3">
                    <Badge tone={r.status === "success" ? "success" : r.status === "error" ? "destructive" : "warning"}>
                      {r.status}
                    </Badge>
                  </td>
                  <td className="p-3">{r.dry_run ? "yes" : "no"}</td>
                  <td className="p-3">{new Date(r.started_at).toLocaleString()}</td>
                  <td className="p-3">
                    {r.items_processed} / {r.items_succeeded} / {r.items_failed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Recent errors</h2>
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Workflow</th>
                <th className="p-3">Node</th>
                <th className="p-3">Message</th>
                <th className="p-3">Retries</th>
                <th className="p-3">Status</th>
                <th className="p-3">When</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="p-3">{e.workflow_name}</td>
                  <td className="p-3">{e.failed_node}</td>
                  <td className="p-3 max-w-md truncate" title={e.error_message}>
                    {e.error_message}
                  </td>
                  <td className="p-3">{e.retry_count}</td>
                  <td className="p-3">
                    <Badge tone={e.is_dead_letter ? "destructive" : "warning"}>{e.resolution_status}</Badge>
                  </td>
                  <td className="p-3">{new Date(e.occurred_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
