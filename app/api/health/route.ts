import { NextResponse } from "next/server";

// Polled by n8n Workflow 00 (System Health Check) — "Public Dashboard URL"
// check. Intentionally does not touch the database so the dashboard's own
// health check never depends on Supabase being reachable.
export async function GET() {
  return NextResponse.json({ status: "ok", service: "bellwether-outreach-dashboard", time: new Date().toISOString() });
}
