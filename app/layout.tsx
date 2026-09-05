import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Bellwether Outreach Dashboard",
  description: "Tracking + approval dashboard for the Bellwether Staffing Solutions outreach system.",
};

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/companies", label: "Qualified Companies" },
  { href: "/approval-queue", label: "Approval Queue" },
  { href: "/outreach", label: "Active Outreach" },
  { href: "/replies", label: "Replies" },
  { href: "/interested", label: "Interested Leads" },
  { href: "/meetings", label: "Meetings" },
  { href: "/suppression", label: "Suppression List" },
  { href: "/analytics", label: "Analytics" },
  { href: "/workflow-health", label: "Workflow Health" },
  { href: "/settings", label: "Settings" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          <aside className="w-64 shrink-0 border-r border-border p-4">
            <div className="mb-6">
              <div className="font-semibold">Bellwether Outreach</div>
              <div className="text-xs text-muted-foreground">Internal dashboard</div>
            </div>
            <nav className="space-y-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded px-3 py-2 text-sm hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
