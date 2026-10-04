import type { InputHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string };

export function Field({ label, hint, error, id, ...props }: FieldProps) {
  const inputId = id ?? props.name;
  const hintId = hint && inputId ? `${inputId}-hint` : undefined;
  const errorId = error && inputId ? `${inputId}-error` : undefined;

  return (
    <div className="grid gap-2">
      <label htmlFor={inputId} className="font-semibold text-foreground">{label}</label>
      {hint ? <p id={hintId} className="text-sm text-muted">{hint}</p> : null}
      <input id={inputId} aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined} aria-invalid={Boolean(error) || undefined} className="min-h-11 rounded-control border border-border bg-surface px-3 py-2 text-foreground placeholder:text-slate-400 disabled:bg-slate-100" {...props} />
      {error ? <p id={errorId} className="text-sm font-medium text-danger" role="alert">{error}</p> : null}
    </div>
  );
}
