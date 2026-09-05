import { getServerSupabase } from "@/lib/supabaseClient";
import { Card, StatCard } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

async function getAnalytics() {
  const supabase = getServerSupabase();
  const { data: metrics } = await supabase
    .from("daily_metrics")
    .select("*")
    .order("metric_date", { ascending: false })
    .limit(30);

  const totals = (metrics ?? []).reduce(
    (acc, m) => {
      acc.discovered += m.companies_discovered;
      acc.qualified += m.companies_qualified;
      acc.contactsEnrolled += m.contacts_enrolled;
      acc.emailsSent += m.emails_sent;
      acc.replies += m.replies_count;
      acc.positive += m.positive_replies;
      acc.meetings += m.meetings_requested;
      acc.bounces += m.bounces;
      acc.unsubscribes += m.unsubscribes;
      return acc;
    },
    { discovered: 0, qualified: 0, contactsEnrolled: 0, emailsSent: 0, replies: 0, positive: 0, meetings: 0, bounces: 0, unsubscribes: 0 }
  );

  const latest = metrics?.[0];

  return { metrics: metrics ?? [], totals, latest };
}

function rate(n: number, d: number): string {
  return d > 0 ? `${((n / d) * 100).toFixed(1)}%` : "0.0%";
}

export default async function AnalyticsPage() {
  const { metrics, totals, latest } = await getAnalytics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Last 30 days, aggregated from daily_metrics (real data only).</p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Outreach funnel (30 days)</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Discovered" value={totals.discovered} />
          <StatCard label="Qualified" value={totals.qualified} />
          <StatCard label="Enrolled" value={totals.contactsEnrolled} />
          <StatCard label="Sent" value={totals.emailsSent} />
          <StatCard label="Replies" value={totals.replies} />
          <StatCard label="Meetings" value={totals.meetings} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Rates (30 days)</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Reply rate" value={rate(totals.replies, totals.emailsSent)} />
          <StatCard label="Positive-reply rate" value={rate(totals.positive, totals.emailsSent)} />
          <StatCard label="Meeting rate" value={rate(totals.meetings, totals.emailsSent)} />
          <StatCard label="Bounce rate" value={rate(totals.bounces, totals.emailsSent)} />
        </div>
      </div>

      {latest ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h3 className="mb-2 text-sm font-medium">Performance by industry (latest day)</h3>
            <pre className="max-h-64 overflow-auto text-xs">{JSON.stringify(latest.performance_by_industry, null, 2)}</pre>
          </Card>
          <Card>
            <h3 className="mb-2 text-sm font-medium">Performance by contact title (latest day)</h3>
            <pre className="max-h-64 overflow-auto text-xs">{JSON.stringify(latest.performance_by_contact_title, null, 2)}</pre>
          </Card>
          <Card>
            <h3 className="mb-2 text-sm font-medium">Performance by company size (latest day)</h3>
            <pre className="max-h-64 overflow-auto text-xs">{JSON.stringify(latest.performance_by_company_size, null, 2)}</pre>
          </Card>
          <Card>
            <h3 className="mb-2 text-sm font-medium">Performance by hiring volume (latest day)</h3>
            <pre className="max-h-64 overflow-auto text-xs">{JSON.stringify(latest.performance_by_job_volume, null, 2)}</pre>
          </Card>
        </div>
      ) : (
        <Card>No daily_metrics rows yet — Workflow 09 populates this table once a day has completed.</Card>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Discovered</th>
              <th className="p-3">Qualified</th>
              <th className="p-3">Enrolled</th>
              <th className="p-3">Sent</th>
              <th className="p-3">Replies</th>
              <th className="p-3">Positive</th>
              <th className="p-3">Bounces</th>
              <th className="p-3">Unsubs</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0">
                <td className="p-3">{m.metric_date}</td>
                <td className="p-3">{m.companies_discovered}</td>
                <td className="p-3">{m.companies_qualified}</td>
                <td className="p-3">{m.contacts_enrolled}</td>
                <td className="p-3">{m.emails_sent}</td>
                <td className="p-3">{m.replies_count}</td>
                <td className="p-3">{m.positive_replies}</td>
                <td className="p-3">{m.bounces}</td>
                <td className="p-3">{m.unsubscribes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
