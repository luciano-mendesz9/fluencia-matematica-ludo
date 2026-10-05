import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/src/features/auth/login-form";
import { getCurrentSession } from "@/src/server/auth/session";

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session) redirect(session.destination);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-panel border border-border bg-surface p-6 shadow-[0_18px_50px_rgba(23,105,224,0.10)] sm:p-8" aria-labelledby="login-title">
        <Link href="/" className="text-sm font-semibold text-brand hover:text-brand-hover">← Voltar ao início</Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-brand">Acesso seguro</p>
        <h1 id="login-title" className="mt-2 text-3xl font-bold tracking-tight text-foreground">Entrar na Fluência Matemática</h1>
        <p className="mt-3 leading-7 text-muted">Adultos usam o e-mail institucional. Alunos usam o código individual.</p>
        <LoginForm requestId={randomUUID()} />
        <Link href="/recuperar-acesso" className="mt-6 inline-block font-semibold text-brand hover:text-brand-hover">Esqueci minha senha</Link>
      </section>
    </main>
  );
}
