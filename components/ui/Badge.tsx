const COLORS: Record<string, string> = {
  neutral: "bg-muted text-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
  primary: "bg-primary/15 text-primary",
};

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: keyof typeof COLORS }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${COLORS[tone]}`}>
      {children}
    </span>
  );
}

export function statusTone(status: string): keyof typeof COLORS {
  const map: Record<string, keyof typeof COLORS> = {
    qualified: "success",
    approved: "success",
    enrolled: "primary",
    active: "primary",
    pending: "warning",
    held: "warning",
    regenerate_requested: "warning",
    rejected: "destructive",
    suppressed: "destructive",
    removed: "destructive",
    failed: "destructive",
    finished: "neutral",
    discovered: "neutral",
  };
  return map[status] ?? "neutral";
}
