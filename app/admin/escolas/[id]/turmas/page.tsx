import Link from "next/link";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { CreateClassGroupForm } from "@/src/features/academics/academic-forms";
import { ClassGroupList } from "@/src/features/academics/academic-lists";
import { requireArea } from "@/src/server/auth/guard";
import { listAcademicYears, listClassGroups } from "@/src/server/academics/service";
import { getSchoolSummaryForAdmin } from "@/src/server/schools/service";

const navigation = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/escolas", label: "Escolas" },
  { href: "/admin/redefinir-senha-aluno", label: "Redefinir senha de aluno" },
];

export default async function AdminClassGroupsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireArea("admin");
  const { id } = await params;
  const actor = { ...session.user };
  const [school, years, groups] = await Promise.all([
    getSchoolSummaryForAdmin(actor, id),
    listAcademicYears({ actor, schoolId: id }),
    listClassGroups({ actor, schoolId: id }),
  ]);
  return (
    <AppShell areaLabel="Administração" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel="SEMED">
      <Link href={`/admin/escolas/${school.id}`} className="font-semibold text-brand hover:text-brand-hover">← Voltar à escola</Link>
      <div className="mt-5 grid gap-8 xl:grid-cols-[minmax(18rem,26rem)_minmax(0,1fr)]">
        <section className="rounded-panel border border-border bg-surface p-5 sm:p-6" aria-labelledby="admin-new-class-title">
          <h1 id="admin-new-class-title" className="text-2xl font-bold text-foreground">Cadastrar turma</h1>
          <p className="mb-6 mt-2 text-muted">{school.name}</p>
          <CreateClassGroupForm schoolId={school.id} academicYears={years} />
        </section>
        <section className="min-w-0" aria-labelledby="admin-classes-title">
          <h2 id="admin-classes-title" className="text-2xl font-bold text-foreground">Turmas</h2>
          <ClassGroupList groups={groups} detailBasePath={`/admin/escolas/${school.id}/turmas`} />
        </section>
      </div>
    </AppShell>
  );
}
