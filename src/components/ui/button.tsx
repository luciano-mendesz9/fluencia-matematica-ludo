import { forwardRef, type ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "border-brand bg-brand text-white hover:bg-brand-hover",
  secondary: "border-border bg-surface text-foreground hover:border-brand hover:text-brand",
  danger: "border-danger bg-danger text-white hover:brightness-90",
};

export function buttonClassName(variant: ButtonVariant = "primary") {
  return `inline-flex min-h-11 items-center justify-center rounded-control border px-5 py-2.5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; busy?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", busy = false, disabled, children, type = "button", className = "", ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={`${buttonClassName(variant)} ${className}`.trim()} disabled={disabled || busy} aria-busy={busy || undefined} {...props}>
      {busy ? "Aguarde..." : children}
    </button>
  );
});
