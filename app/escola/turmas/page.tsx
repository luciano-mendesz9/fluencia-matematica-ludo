import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { CreateClassGroupForm } from "@/src/features/academics/academic-forms";
import { ClassGroupList } from "@/src/features/academics/academic-lists";
import { schoolNavigation } from "@/src/features/academics/navigation";
import { SchoolSwitcher } from "@/src/features/schools/school-forms";
import { requireArea } from "@/src/server/auth/guard";
import { listAcademicYears, listClassGroups } from "@/src/server/academics/service";
import { listAvailableSchools } from "@/src/server/schools/service";

export default async function ClassGroupsPage() {
  const session = await requireArea("escola");
  const school = session.schoolContext!;
  const actor = { ...session.user };
  const [academicYears, groups, schools] = await Promise.all([
    listAcademicYears({ actor, schoolId: school.schoolId }),
    listClassGroups({ actor, schoolId: school.schoolId }),
    listAvailableSchools(session.user.id),
  ]);
  return (
    <AppShell areaLabel="Coordenação" currentUserLabel={session.user.name} navigation={schoolNavigation} accountAction={<LogoutForm />} contextAction={<SchoolSwitcher userId={session.user.id} schools={schools} currentSchoolId={school.schoolId} />} statusLabel={school.schoolName}>
      <div className="grid gap-8 xl:grid-cols-[minmax(18rem,26rem)_minmax(0,1fr)]">
        <section className="rounded-panel border border-border bg-surface p-5 sm:p-6" aria-labelledby="new-class-title">
          <h1 id="new-class-title" className="text-2xl font-bold text-foreground">Cadastrar turma</h1>
          <p className="mb-6 mt-2 text-muted">Turmas do 1º ao 5º ano, sem importação.</p>
          <CreateClassGroupForm schoolId={school.schoolId} academicYears={academicYears} />
        </section>
        <section className="min-w-0" aria-labelledby="classes-title">
          <h2 id="classes-title" className="text-2xl font-bold text-foreground">Turmas</h2>
          <ClassGroupList groups={groups} detailBasePath="/escola/turmas" />
        </section>
      </div>
    </AppShell>
  );
}
