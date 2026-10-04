import type { ReactNode } from "react";

const styles = {
  info: "border-blue-200 bg-blue-50 text-blue-950",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  error: "border-red-200 bg-red-50 text-red-950",
};

export function Feedback({ title, children, variant = "info" }: { title: string; children: ReactNode; variant?: keyof typeof styles }) {
  return <div className={`rounded-panel border p-4 ${styles[variant]}`} role="status"><p className="font-bold">{title}</p><div className="mt-1 text-sm leading-6">{children}</div></div>;
}
