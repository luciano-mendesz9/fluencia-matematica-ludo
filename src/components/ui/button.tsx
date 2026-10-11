import { forwardRef, type ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-brand text-white shadow-sm hover:bg-brand-hover",
  secondary: "border-border bg-surface text-foreground hover:border-blue-200 hover:bg-blue-50 hover:text-brand",
  danger: "border-transparent bg-danger text-white shadow-sm hover:brightness-90",
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
