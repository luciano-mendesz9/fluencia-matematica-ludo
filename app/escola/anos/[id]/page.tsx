import Link from "next/link";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { EditAcademicYearForm } from "@/src/features/academics/academic-forms";
import { schoolNavigation } from "@/src/features/academics/navigation";
import { SchoolSwitcher } from "@/src/features/schools/school-forms";
import { requireArea } from "@/src/server/auth/guard";
import { getAcademicYear } from "@/src/server/academics/service";
import { listAvailableSchools } from "@/src/server/schools/service";

export default async function AcademicYearDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireArea("escola");
  const school = session.schoolContext!;
  const { id } = await params;
  const [academicYear, schools] = await Promise.all([
    getAcademicYear({ actor: { ...session.user }, schoolId: school.schoolId, academicYearId: id }),
    listAvailableSchools(session.user.id),
  ]);
  return (
    <AppShell areaLabel="Coordenação" currentUserLabel={session.user.name} navigation={schoolNavigation} accountAction={<LogoutForm />} contextAction={<SchoolSwitcher userId={session.user.id} schools={schools} currentSchoolId={school.schoolId} />} statusLabel={school.schoolName}>
      <Link href="/escola/anos" className="font-semibold text-brand hover:text-brand-hover">← Voltar aos anos letivos</Link>
      <h1 className="mt-5 text-3xl font-bold text-foreground">Ano letivo {academicYear.year}</h1>
      <p className="mt-2 text-muted">{academicYear._count.classGroups} turma(s) vinculada(s). Não há exclusão física.</p>
      <section className="mt-6 max-w-2xl rounded-panel border border-border bg-surface p-5 sm:p-6" aria-labelledby="edit-year-title">
        <h2 id="edit-year-title" className="mb-5 text-xl font-bold text-foreground">Editar ano letivo</h2>
        <EditAcademicYearForm schoolId={school.schoolId} academicYear={academicYear} />
      </section>
    </AppShell>
  );
}
