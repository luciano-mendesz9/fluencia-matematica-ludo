import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { schoolNavigation } from "@/src/features/academics/navigation";
import { SchoolSwitcher } from "@/src/features/schools/school-forms";
import { StudentDetail } from "@/src/features/students/student-detail";
import { requireArea } from "@/src/server/auth/guard";
import { listClassGroups } from "@/src/server/academics/service";
import { listAvailableSchools } from "@/src/server/schools/service";
import { getStudent } from "@/src/server/students/service";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireArea("escola");
  const school = session.schoolContext!;
  const actor = { ...session.user };
  const { id } = await params;
  const [student, classes, schools] = await Promise.all([
    getStudent({ actor, schoolId: school.schoolId, studentId: id }),
    listClassGroups({ actor, schoolId: school.schoolId }),
    listAvailableSchools(session.user.id),
  ]);
  const activeClasses = classes.filter((group) => group.status === "ACTIVE" && group.academicYear.status === "ACTIVE");
  return (
    <AppShell areaLabel="Coordenação" currentUserLabel={session.user.name} navigation={schoolNavigation} accountAction={<LogoutForm />} contextAction={<SchoolSwitcher userId={session.user.id} schools={schools} currentSchoolId={school.schoolId} />} statusLabel={school.schoolName}>
      <StudentDetail student={student} schoolId={school.schoolId} activeClasses={activeClasses} backHref="/escola/alunos" canResetPassword={Boolean(student.activeEnrollment)} />
    </AppShell>
  );
}
