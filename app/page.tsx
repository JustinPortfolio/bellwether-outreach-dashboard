import { getServerSupabase } from "@/lib/supabaseClient";
import { StatCard } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

async function getOverviewData() {
  const supabase = getServerSupabase();

  const [
    qualifiedRes,
    awaitingRes,
    activeContactsRes,
    repliesWeekRes,
    positiveRepliesWeekRes,
    meetingsWeekRes,
    bouncesWeekRes,
    unsubWeekRes,
    sentWeekRes,
  ] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }).eq("status", "qualified"),
    supabase.from("approval_queue").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("is_active_in_outreach", true),
    supabase
      .from("replies")
      .select("id", { count: "exact", head: true })
      .gte("received_at", new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase
      .from("replies")
      .select("id", { count: "exact", head: true })
      .in("classification", ["interested", "wants_meeting"])
      .gte("received_at", new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase
      .from("replies")
      .select("id", { count: "exact", head: true })
      .eq("classification", "wants_meeting")
      .gte("received_at", new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase
      .from("suppression_list")
      .select("id", { count: "exact", head: true })
      .eq("source", "bounce")
      .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase
      .from("suppression_list")
      .select("id", { count: "exact", head: true })
      .eq("source", "unsubscribe")
      .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase
      .from("email_activities")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "sent")
      .gte("occurred_at", new Date(Date.now() - 7 * 86400000).toISOString()),
  ]);

  const sentWeek = sentWeekRes.count ?? 0;
  const bounceRate = sentWeek > 0 ? (((bouncesWeekRes.count ?? 0) / sentWeek) * 100).toFixed(1) : "0.0";
  const unsubRate = sentWeek > 0 ? (((unsubWeekRes.count ?? 0) / sentWeek) * 100).toFixed(1) : "0.0";

  const { data: settingsRows } = await supabase
    .from("system_settings")
    .select("key, value")
    .in("key", ["dry_run", "kill_switch_enabled", "production_sending_enabled"]);
  const settings = Object.fromEntries((settingsRows ?? []).map((r) => [r.key, r.value]));

  return {
    qualified: qualifiedRes.count ?? 0,
    awaiting: awaitingRes.count ?? 0,
    activeContacts: activeContactsRes.count ?? 0,
    repliesWeek: repliesWeekRes.count ?? 0,
    positiveRepliesWeek: positiveRepliesWeekRes.count ?? 0,
    meetingsWeek: meetingsWeekRes.count ?? 0,
    bounceRate,
    unsubRate,
    settings,
  };
}

export default async function OverviewPage() {
  const data = await getOverviewData();
  const dryRun = data.settings.dry_run !== false && data.settings.dry_run !== "false";
  const killSwitch = data.settings.kill_switch_enabled === true || data.settings.kill_switch_enabled === "true";
  const productionEnabled =
    data.settings.production_sending_enabled === true || data.settings.production_sending_enabled === "true";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">Bellwether Staffing Solutions — outreach system status</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <span className={`rounded px-3 py-1 text-sm ${dryRun ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>
          DRY_RUN: {dryRun ? "ON (no real sending)" : "OFF"}
        </span>
        <span className={`rounded px-3 py-1 text-sm ${killSwitch ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`}>
          Kill switch: {killSwitch ? "PAUSED — all outreach halted" : "not active"}
        </span>
        <span className={`rounded px-3 py-1 text-sm ${productionEnabled ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
          Production sending: {productionEnabled ? "enabled" : "disabled (awaiting admin approval)"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Qualified companies" value={data.qualified} />
        <StatCard label="Awaiting approval" value={data.awaiting} />
        <StatCard label="Active contacts" value={data.activeContacts} />
        <StatCard label="Replies this week" value={data.repliesWeek} />
        <StatCard label="Positive replies" value={data.positiveRepliesWeek} />
        <StatCard label="Meetings requested" value={data.meetingsWeek} sub="this week" />
        <StatCard label="Bounce rate" value={`${data.bounceRate}%`} sub="last 7 days" />
        <StatCard label="Unsubscribe rate" value={`${data.unsubRate}%`} sub="last 7 days" />
      </div>
    </div>
  );
}
