import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { AssistedStudentResetForm } from "@/src/features/recovery/recovery-forms";
import { requireArea } from "@/src/server/auth/guard";

const navigation = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/escolas", label: "Escolas" },
  { href: "/admin/redefinir-senha-aluno", label: "Redefinir senha de aluno" },
];

export default async function AssistedStudentResetPage() {
  const session = await requireArea("admin");
  return (
    <AppShell areaLabel="Administração" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel="Sessão ativa">
      <section className="rounded-panel border border-border bg-surface p-5 sm:p-7" aria-labelledby="student-reset-title">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">Ação auditada</p>
        <h1 id="student-reset-title" className="mt-2 text-2xl font-bold text-foreground">Redefinir senha de aluno</h1>
        <p className="mb-6 mt-2 max-w-2xl leading-7 text-muted">A nova senha invalida imediatamente todas as sessões anteriores do aluno. Nenhuma senha é exibida em listas ou registros.</p>
        <AssistedStudentResetForm />
      </section>
    </AppShell>
  );
}
