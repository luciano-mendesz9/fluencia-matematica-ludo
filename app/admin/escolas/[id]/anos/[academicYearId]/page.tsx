import Link from "next/link";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { EditAcademicYearForm } from "@/src/features/academics/academic-forms";
import { requireArea } from "@/src/server/auth/guard";
import { getAcademicYear } from "@/src/server/academics/service";
import { getSchoolSummaryForAdmin } from "@/src/server/schools/service";

const navigation = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/escolas", label: "Escolas" },
  { href: "/admin/redefinir-senha-aluno", label: "Redefinir senha de aluno" },
];

export default async function AdminAcademicYearDetailPage({ params }: {
  params: Promise<{ id: string; academicYearId: string }>;
}) {
  const session = await requireArea("admin");
  const { id, academicYearId } = await params;
  const actor = { ...session.user };
  const [school, year] = await Promise.all([
    getSchoolSummaryForAdmin(actor, id),
    getAcademicYear({ actor, schoolId: id, academicYearId }),
  ]);
  return (
    <AppShell areaLabel="Administração" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel="SEMED">
      <Link href={`/admin/escolas/${school.id}/anos`} className="font-semibold text-brand hover:text-brand-hover">← Voltar aos anos letivos</Link>
      <h1 className="mt-5 text-3xl font-bold text-foreground">Ano letivo {year.year}</h1>
      <p className="mt-2 text-muted">{school.name} · {year._count.classGroups} turma(s)</p>
      <section className="mt-6 max-w-2xl rounded-panel border border-border bg-surface p-5 sm:p-6" aria-labelledby="admin-edit-year-title">
        <h2 id="admin-edit-year-title" className="mb-5 text-xl font-bold text-foreground">Editar ano letivo</h2>
        <EditAcademicYearForm schoolId={school.id} academicYear={year} />
      </section>
    </AppShell>
  );
}
