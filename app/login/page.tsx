import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/src/features/auth/login-form";
import { getCurrentSession } from "@/src/server/auth/session";

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session) redirect(session.destination);

  return (
    <main className="min-h-screen bg-background p-3 sm:p-6 lg:grid lg:place-items-center">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] w-full max-w-6xl overflow-hidden rounded-[1.4rem] border border-[#e3e9f1] bg-surface shadow-[0_20px_70px_rgba(28,55,91,0.10)] sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden overflow-hidden bg-[#1255b8] p-10 text-white lg:flex lg:flex-col lg:justify-between" aria-label="Apresentação da plataforma">
          <div className="absolute -right-24 -top-24 size-80 rounded-full bg-white/10" /><div className="absolute -bottom-32 -left-24 size-96 rounded-full bg-blue-300/10" />
          <Link href="/" className="relative flex items-center gap-3 font-bold"><span className="grid size-11 place-items-center rounded-xl bg-white text-xl font-extrabold text-brand" aria-hidden="true">∑</span><span>Fluência Matemática</span></Link>
          <div className="relative max-w-md"><p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-100">Acesso à plataforma</p><h2 className="mt-4 text-4xl font-bold leading-tight">Aprendizagem acompanhada com clareza.</h2><p className="mt-5 text-base leading-7 text-blue-50">Um ambiente seguro para organizar turmas, atividades e questões, respeitando o papel e os vínculos de cada pessoa.</p></div>
          <p className="relative text-sm text-blue-100">Acesso autorizado pela sua escola ou pela SEMED.</p>
        </aside>
        <section className="flex items-center px-5 py-8 sm:px-10 lg:px-14" aria-labelledby="login-title">
          <div className="mx-auto w-full max-w-md">
            <Link href="/" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand hover:text-brand-hover">← Voltar ao início</Link>
            <div className="mt-5 flex items-center gap-3 lg:hidden"><span className="grid size-10 place-items-center rounded-xl bg-brand text-lg font-extrabold text-white" aria-hidden="true">∑</span><span className="font-bold">Fluência Matemática</span></div>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-brand">Acesso seguro</p>
            <h1 id="login-title" className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Boas-vindas</h1>
            <p className="mt-3 leading-7 text-muted">Entre com seus dados para continuar. Adultos usam o e-mail institucional; alunos usam o código individual.</p>
            <LoginForm requestId={randomUUID()} />
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"><Link href="/recuperar-acesso" className="inline-flex min-h-11 items-center font-semibold text-brand hover:text-brand-hover">Esqueci minha senha</Link><span className="text-xs text-muted">Conexão e sessão protegidas</span></div>
          </div>
        </section>
      </div>
    </main>
  );
}
