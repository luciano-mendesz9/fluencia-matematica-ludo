import type { ReactNode } from "react";

const styles = {
  neutral: "border-border bg-background text-muted",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  success: "border-emerald-200 bg-emerald-50 text-success",
  warning: "border-amber-200 bg-amber-50 text-warning",
  danger: "border-red-200 bg-red-50 text-danger",
};

export function Badge({ children, variant = "neutral" }: { children: ReactNode; variant?: keyof typeof styles }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[variant]}`}>{children}</span>;
}
