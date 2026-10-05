import Link from "next/link";
import { ConsumeResetForm } from "@/src/features/recovery/recovery-forms";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-panel border border-border bg-surface p-6 shadow-[0_18px_50px_rgba(23,105,224,0.10)] sm:p-8" aria-labelledby="reset-title">
        <Link href="/login" className="text-sm font-semibold text-brand hover:text-brand-hover">← Voltar ao login</Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-brand">Link de uso único</p>
        <h1 id="reset-title" className="mt-2 text-3xl font-bold tracking-tight text-foreground">Definir nova senha</h1>
        {token ? <ConsumeResetForm token={token} /> : <p className="mt-6 rounded-control border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-950" role="alert">O link de recuperação está incompleto.</p>}
      </section>
    </main>
  );
}
