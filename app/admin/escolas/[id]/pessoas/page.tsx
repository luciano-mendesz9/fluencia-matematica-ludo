import Link from "next/link";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { CreateLocalAdultForm, LinkExistingAdultForm } from "@/src/features/people/people-forms";
import { SchoolPeopleList } from "@/src/features/people/people-lists";
import { requireArea } from "@/src/server/auth/guard";
import { listClassGroups } from "@/src/server/academics/service";
import { listSchoolAdults } from "@/src/server/people/service";
import { getSchoolSummaryForAdmin } from "@/src/server/schools/service";

const navigation = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/escolas", label: "Escolas" },
  { href: "/admin/pessoas", label: "Pessoas globais" },
  { href: "/admin/redefinir-senha-aluno", label: "Redefinir senha de aluno" },
];

export default async function AdminSchoolPeoplePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireArea("admin");
  const { id } = await params;
  const actor = { ...session.user };
  const [school, memberships, classes] = await Promise.all([
    getSchoolSummaryForAdmin(actor, id),
    listSchoolAdults({ actor, schoolId: id }),
    listClassGroups({ actor, schoolId: id }),
  ]);
  const activeClasses = classes.filter((group) => group.status === "ACTIVE" && group.academicYear.status === "ACTIVE");
  return (
    <AppShell areaLabel="Administração" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel={`SEMED · ${school.name}`}>
      <Link href={`/admin/escolas/${school.id}`} className="font-semibold text-brand hover:text-brand-hover">← Voltar à escola</Link>
      <h1 className="mt-5 text-3xl font-bold text-foreground">Pessoas e atribuições</h1>
      <p className="mt-2 text-muted">Gerencie coordenadores, professores e suas turmas em {school.name}.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-panel border border-border bg-surface p-5 sm:p-6" aria-labelledby="admin-new-local-adult-title">
          <h2 id="admin-new-local-adult-title" className="text-xl font-bold text-foreground">Nova conta local</h2>
          <div className="mt-5"><CreateLocalAdultForm schoolId={school.id} canManageCoordinators /></div>
        </section>
        <section className="rounded-panel border border-border bg-surface p-5 sm:p-6" aria-labelledby="admin-link-local-adult-title">
          <h2 id="admin-link-local-adult-title" className="text-xl font-bold text-foreground">Vincular conta existente</h2>
          <div className="mt-5"><LinkExistingAdultForm schoolId={school.id} canManageCoordinators /></div>
        </section>
      </div>
      <section className="mt-8" aria-labelledby="admin-school-people-title">
        <h2 id="admin-school-people-title" className="text-2xl font-bold text-foreground">Pessoas da escola</h2>
        <div className="mt-4"><SchoolPeopleList schoolId={school.id} memberships={memberships} classes={activeClasses} canManageCoordinators /></div>
      </section>
    </AppShell>
  );
}
