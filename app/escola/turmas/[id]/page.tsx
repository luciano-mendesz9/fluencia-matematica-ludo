import Link from "next/link";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { EditClassGroupForm } from "@/src/features/academics/academic-forms";
import { schoolNavigation } from "@/src/features/academics/navigation";
import { SchoolSwitcher } from "@/src/features/schools/school-forms";
import { requireArea } from "@/src/server/auth/guard";
import { getClassGroup, listAcademicYears } from "@/src/server/academics/service";
import { listAvailableSchools } from "@/src/server/schools/service";

export default async function ClassGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireArea("escola");
  const school = session.schoolContext!;
  const actor = { ...session.user };
  const { id } = await params;
  const [classGroup, academicYears, schools] = await Promise.all([
    getClassGroup({ actor, schoolId: school.schoolId, classGroupId: id }),
    listAcademicYears({ actor, schoolId: school.schoolId }),
    listAvailableSchools(session.user.id),
  ]);
  return (
    <AppShell areaLabel="Coordenação" currentUserLabel={session.user.name} navigation={schoolNavigation} accountAction={<LogoutForm />} contextAction={<SchoolSwitcher userId={session.user.id} schools={schools} currentSchoolId={school.schoolId} />} statusLabel={school.schoolName}>
      <Link href="/escola/turmas" className="font-semibold text-brand hover:text-brand-hover">← Voltar às turmas</Link>
      <h1 className="mt-5 text-3xl font-bold text-foreground">{classGroup.name}</h1>
      <p className="mt-2 text-muted">{classGroup.grade}º ano · ano letivo {classGroup.academicYear.year}</p>
      <section className="mt-6 max-w-2xl rounded-panel border border-border bg-surface p-5 sm:p-6" aria-labelledby="edit-class-title">
        <h2 id="edit-class-title" className="mb-5 text-xl font-bold text-foreground">Editar turma</h2>
        <EditClassGroupForm schoolId={school.schoolId} classGroup={classGroup} academicYears={academicYears} />
      </section>
    </AppShell>
  );
}
