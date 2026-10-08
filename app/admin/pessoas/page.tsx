import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { CreateGlobalAdultForm } from "@/src/features/people/people-forms";
import { GlobalAdultList } from "@/src/features/people/people-lists";
import { requireArea } from "@/src/server/auth/guard";
import { listGlobalAdults } from "@/src/server/people/service";

const navigation = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/escolas", label: "Escolas" },
  { href: "/admin/pessoas", label: "Pessoas globais" },
  { href: "/admin/redefinir-senha-aluno", label: "Redefinir senha de aluno" },
];

export default async function GlobalPeoplePage() {
  const session = await requireArea("admin");
  const adults = await listGlobalAdults({ ...session.user });
  return (
    <AppShell areaLabel="Administração" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel="SEMED">
      <div className="grid gap-8 xl:grid-cols-[minmax(19rem,28rem)_minmax(0,1fr)]">
        <section className="rounded-panel border border-border bg-surface p-5 sm:p-6" aria-labelledby="new-global-adult-title">
          <h1 id="new-global-adult-title" className="text-2xl font-bold text-foreground">Cadastrar conta global</h1>
          <p className="mb-6 mt-2 text-muted">Somente SEMED e operação técnica. Professores e coordenadores são cadastrados dentro da escola.</p>
          <CreateGlobalAdultForm />
        </section>
        <section className="min-w-0" aria-labelledby="global-adults-title">
          <h2 id="global-adults-title" className="text-2xl font-bold text-foreground">Contas globais</h2>
          <p className="mb-4 mt-2 text-muted">Bloqueios revogam as sessões imediatamente. O último administrador ativo é protegido.</p>
          <GlobalAdultList adults={adults} />
        </section>
      </div>
    </AppShell>
  );
}
