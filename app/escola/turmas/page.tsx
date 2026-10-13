import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { ClassManagement } from "@/src/features/academics/class-management";
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
      <header><p className="text-sm font-bold uppercase tracking-[0.12em] text-brand">Estrutura escolar</p><h1 className="mt-2 text-3xl font-bold">Turmas</h1><p className="mt-2 text-muted">Organize as turmas, anos letivos e acessos dos alunos.</p></header>
      <ClassManagement schoolId={school.schoolId} academicYears={academicYears} groups={groups} />
    </AppShell>
  );
}
