import { getServerSupabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/Card";
import { setKillSwitch, setProductionSendingEnabled, updateSystemSetting } from "@/lib/actions";

export const dynamic = "force-dynamic";

const BOOLEAN_KEYS = new Set(["dry_run", "auto_approval_enabled", "compliance_acknowledged"]);
const TEXT_KEYS = new Set(["recruiter_name", "recruiter_email", "bellwether_postal_address", "bellwether_privacy_url", "apollo_sequence_name"]);
const NUMBER_KEYS = new Set([
  "minimum_active_jobs",
  "maximum_active_jobs",
  "jobs_posted_within_days",
  "qualification_threshold",
  "auto_approval_threshold",
  "daily_company_discovery_limit",
  "daily_company_discovery_cap",
  "daily_contact_enrollment_limit",
  "max_contacts_per_hour",
  "cooldown_period_days",
]);

async function getSettings() {
  const supabase = getServerSupabase();
  const { data } = await supabase.from("system_settings").select("*").order("key", { ascending: true });
  return data ?? [];
}

async function saveTextOrNumber(formData: FormData) {
  "use server";
  const key = String(formData.get("key"));
  const raw = String(formData.get("value") ?? "");
  const value = NUMBER_KEYS.has(key) ? Number(raw) : raw;
  await updateSystemSetting(key, value);
}

async function saveJson(formData: FormData) {
  "use server";
  const key = String(formData.get("key"));
  const raw = String(formData.get("value") ?? "{}");
  try {
    const value = JSON.parse(raw);
    await updateSystemSetting(key, value);
  } catch {
    // Invalid JSON is intentionally dropped rather than saved malformed —
    // the operator sees their edit did not persist and can fix the syntax.
  }
}

async function toggleBoolean(formData: FormData) {
  "use server";
  const key = String(formData.get("key"));
  const next = formData.get("next") === "true";
  await updateSystemSetting(key, next);
}

export default async function SettingsPage() {
  const settings = await getSettings();
  const byKey = Object.fromEntries(settings.map((s) => [s.key, s]));

  const killSwitch = byKey["kill_switch_enabled"]?.value === true || byKey["kill_switch_enabled"]?.value === "true";
  const productionEnabled =
    byKey["production_sending_enabled"]?.value === true || byKey["production_sending_enabled"]?.value === "true";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Every value here is read live by the n8n workflows on each run.</p>
      </div>

      <Card className={killSwitch ? "border-destructive" : ""}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Pause All Outreach (kill switch)</div>
            <div className="text-xs text-muted-foreground">
              Immediately halts Workflows 01-05 at their first gate. Does not affect monitoring/suppression.
            </div>
          </div>
          <form action={setKillSwitch.bind(null, !killSwitch)}>
            <button
              type="submit"
              className={`rounded px-4 py-2 text-sm font-medium ${
                killSwitch ? "bg-destructive text-white" : "bg-muted hover:bg-border"
              }`}
            >
              {killSwitch ? "Resume outreach" : "Pause all outreach"}
            </button>
          </form>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Production sending</div>
            <div className="text-xs text-muted-foreground">
              Required, in addition to DRY_RUN=false and per-item approval, before Workflow 05 can enroll anyone.
              Enable only after completing docs/compliance-checklist.md.
            </div>
          </div>
          <form action={setProductionSendingEnabled.bind(null, !productionEnabled)}>
            <button
              type="submit"
              className={`rounded px-4 py-2 text-sm font-medium ${
                productionEnabled ? "bg-success text-white" : "bg-muted hover:bg-border"
              }`}
            >
              {productionEnabled ? "Disable production sending" : "Enable production sending"}
            </button>
          </form>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {settings
          .filter((s) => !["kill_switch_enabled", "production_sending_enabled"].includes(s.key))
          .map((s) => (
            <Card key={s.key}>
              <div className="mb-1 text-sm font-medium">{s.key}</div>
              <div className="mb-2 text-xs text-muted-foreground">{s.description}</div>
              {BOOLEAN_KEYS.has(s.key) ? (
                <form action={toggleBoolean}>
                  <input type="hidden" name="key" value={s.key} />
                  <input type="hidden" name="next" value={String(!(s.value === true || s.value === "true"))} />
                  <button type="submit" className="rounded bg-muted px-3 py-1 text-sm hover:bg-border">
                    Currently: {String(s.value)} — click to toggle
                  </button>
                </form>
              ) : TEXT_KEYS.has(s.key) || NUMBER_KEYS.has(s.key) ? (
                <form action={saveTextOrNumber} className="flex gap-2">
                  <input type="hidden" name="key" value={s.key} />
                  <input
                    name="value"
                    defaultValue={typeof s.value === "string" ? s.value : JSON.stringify(s.value)}
                    className="flex-1 rounded border border-border bg-background p-2 text-sm"
                  />
                  <button type="submit" className="rounded bg-primary/15 px-3 py-1 text-sm text-primary hover:bg-primary/25">
                    Save
                  </button>
                </form>
              ) : (
                <form action={saveJson} className="space-y-2">
                  <input type="hidden" name="key" value={s.key} />
                  <textarea
                    name="value"
                    defaultValue={JSON.stringify(s.value, null, 2)}
                    rows={4}
                    className="w-full rounded border border-border bg-background p-2 font-mono text-xs"
                  />
                  <button type="submit" className="rounded bg-primary/15 px-3 py-1 text-sm text-primary hover:bg-primary/25">
                    Save JSON
                  </button>
                </form>
              )}
            </Card>
          ))}
      </div>
    </div>
  );
}
