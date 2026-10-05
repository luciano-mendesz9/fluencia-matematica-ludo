import Link from "next/link";
import { RequestAdultResetForm } from "@/src/features/recovery/recovery-forms";

export default function RecoverAccessPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-panel border border-border bg-surface p-6 shadow-[0_18px_50px_rgba(23,105,224,0.10)] sm:p-8" aria-labelledby="recover-title">
        <Link href="/login" className="text-sm font-semibold text-brand hover:text-brand-hover">← Voltar ao login</Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-brand">Recuperação de adulto</p>
        <h1 id="recover-title" className="mt-2 text-3xl font-bold tracking-tight text-foreground">Recuperar acesso</h1>
        <p className="mt-3 leading-7 text-muted">Informe o e-mail institucional. A resposta será sempre neutra para proteger as contas cadastradas.</p>
        <RequestAdultResetForm />
        <p className="mt-6 text-sm leading-6 text-muted">Aluno sem acesso deve solicitar uma redefinição à equipe autorizada da escola ou à SEMED.</p>
      </section>
    </main>
  );
}
