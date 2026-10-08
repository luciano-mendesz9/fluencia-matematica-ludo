import Link from "next/link";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { CreateSchoolForm } from "@/src/features/schools/school-forms";
import { requireArea } from "@/src/server/auth/guard";
import { listSchoolsForAdmin } from "@/src/server/schools/service";

const navigation = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/escolas", label: "Escolas" },
  { href: "/admin/pessoas", label: "Pessoas globais" },
  { href: "/admin/redefinir-senha-aluno", label: "Redefinir senha de aluno" },
];

export default async function SchoolsAdminPage() {
  const session = await requireArea("admin");
  const schools = await listSchoolsForAdmin({ ...session.user });
  return (
    <AppShell areaLabel="Administração" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel="SEMED">
      <div className="grid gap-8 xl:grid-cols-[minmax(18rem,26rem)_minmax(0,1fr)]">
        <section className="rounded-panel border border-border bg-surface p-5 sm:p-6" aria-labelledby="new-school-title">
          <h1 id="new-school-title" className="text-2xl font-bold text-foreground">Cadastrar escola</h1>
          <p className="mb-6 mt-2 text-muted">Cadastro individual, sem importação por planilha.</p>
          <CreateSchoolForm />
        </section>
        <section className="min-w-0" aria-labelledby="schools-title">
          <h2 id="schools-title" className="text-2xl font-bold text-foreground">Escolas da rede</h2>
          {schools.length === 0 ? <p className="mt-4 rounded-panel border border-border bg-surface p-5 text-muted">Nenhuma escola cadastrada.</p> : (
            <ul className="mt-4 grid gap-4">
              {schools.map((school) => (
                <li key={school.id} className="rounded-panel border border-border bg-surface p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{school.name}</h3>
                      <p className="text-sm text-muted">{school.externalCode ?? "Sem código externo"} · {school.status === "ACTIVE" ? "Ativa" : "Inativa"} · {school.activeMemberships} vínculo(s) ativo(s)</p>
                    </div>
                    <Link href={`/admin/escolas/${school.id}`} className="inline-flex min-h-11 items-center rounded-control border border-brand px-4 font-semibold text-brand hover:bg-blue-50">Gerenciar</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
