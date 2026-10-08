import Link from "next/link";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { AddMembershipForm, EditSchoolForm, SuspendMembershipForm } from "@/src/features/schools/school-forms";
import { requireArea } from "@/src/server/auth/guard";
import { getSchoolForAdmin } from "@/src/server/schools/service";

const navigation = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/escolas", label: "Escolas" },
  { href: "/admin/redefinir-senha-aluno", label: "Redefinir senha de aluno" },
];

export default async function SchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireArea("admin");
  const { id } = await params;
  const school = await getSchoolForAdmin({ ...session.user }, id);
  return (
    <AppShell areaLabel="Administração" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel="SEMED">
      <Link href="/admin/escolas" className="font-semibold text-brand hover:text-brand-hover">← Voltar às escolas</Link>
      <h1 className="mt-5 text-3xl font-bold text-foreground">{school.name}</h1>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={`/admin/escolas/${school.id}/anos`} className="inline-flex min-h-11 items-center rounded-control border border-brand px-4 font-semibold text-brand hover:bg-blue-50">Gerenciar anos letivos</Link>
        <Link href={`/admin/escolas/${school.id}/turmas`} className="inline-flex min-h-11 items-center rounded-control border border-brand px-4 font-semibold text-brand hover:bg-blue-50">Gerenciar turmas</Link>
      </div>
      <div className="mt-6 grid gap-8 xl:grid-cols-2">
        <section className="rounded-panel border border-border bg-surface p-5 sm:p-6" aria-labelledby="edit-school-title">
          <h2 id="edit-school-title" className="mb-5 text-xl font-bold">Dados da escola</h2>
          <EditSchoolForm school={school} />
        </section>
        <section className="rounded-panel border border-border bg-surface p-5 sm:p-6" aria-labelledby="membership-title">
          <h2 id="membership-title" className="text-xl font-bold">Adicionar vínculo</h2>
          <p className="mb-5 mt-2 text-sm text-muted">A conta adulta deve existir e não pode ter papel global.</p>
          <AddMembershipForm schoolId={school.id} />
        </section>
      </div>
      <section className="mt-8" aria-labelledby="membership-list-title">
        <h2 id="membership-list-title" className="text-2xl font-bold">Vínculos</h2>
        {school.memberships.length === 0 ? <p className="mt-4 rounded-panel border border-border bg-surface p-5 text-muted">Nenhum vínculo cadastrado.</p> : (
          <ul className="mt-4 grid gap-4">
            {school.memberships.map((membership) => (
              <li key={membership.id} className="rounded-panel border border-border bg-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-foreground">{membership.user.name}</h3>
                    <p className="text-sm text-muted">{membership.user.email} · {membership.role === "COORDINATOR" ? "Coordenador" : "Professor"} · {membership.status === "ACTIVE" ? "Ativo" : "Suspenso"}</p>
                  </div>
                  {membership.status === "ACTIVE" ? <SuspendMembershipForm membershipId={membership.id} schoolId={school.id} revision={membership.revision} /> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
