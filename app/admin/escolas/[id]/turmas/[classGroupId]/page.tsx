import Link from "next/link";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { EditClassGroupForm } from "@/src/features/academics/academic-forms";
import { requireArea } from "@/src/server/auth/guard";
import { getClassGroup, listAcademicYears } from "@/src/server/academics/service";
import { getSchoolSummaryForAdmin } from "@/src/server/schools/service";

const navigation = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/escolas", label: "Escolas" },
  { href: "/admin/redefinir-senha-aluno", label: "Redefinir senha de aluno" },
];

export default async function AdminClassGroupDetailPage({ params }: {
  params: Promise<{ id: string; classGroupId: string }>;
}) {
  const session = await requireArea("admin");
  const { id, classGroupId } = await params;
  const actor = { ...session.user };
  const [school, group, years] = await Promise.all([
    getSchoolSummaryForAdmin(actor, id),
    getClassGroup({ actor, schoolId: id, classGroupId }),
    listAcademicYears({ actor, schoolId: id }),
  ]);
  return (
    <AppShell areaLabel="Administração" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel="SEMED">
      <Link href={`/admin/escolas/${school.id}/turmas`} className="font-semibold text-brand hover:text-brand-hover">← Voltar às turmas</Link>
      <h1 className="mt-5 text-3xl font-bold text-foreground">{group.name}</h1>
      <p className="mt-2 text-muted">{school.name} · {group.grade}º ano · {group.academicYear.year}</p>
      <section className="mt-6 max-w-2xl rounded-panel border border-border bg-surface p-5 sm:p-6" aria-labelledby="admin-edit-class-title">
        <h2 id="admin-edit-class-title" className="mb-5 text-xl font-bold text-foreground">Editar turma</h2>
        <EditClassGroupForm schoolId={school.id} classGroup={group} academicYears={years} />
      </section>
    </AppShell>
  );
}
