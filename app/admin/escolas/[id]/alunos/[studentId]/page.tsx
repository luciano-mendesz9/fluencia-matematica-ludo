import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { StudentDetail } from "@/src/features/students/student-detail";
import { requireArea } from "@/src/server/auth/guard";
import { listClassGroups } from "@/src/server/academics/service";
import { getSchoolSummaryForAdmin } from "@/src/server/schools/service";
import { getStudent } from "@/src/server/students/service";

const navigation = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/escolas", label: "Escolas" },
  { href: "/admin/redefinir-senha-aluno", label: "Redefinir senha de aluno" },
];

export default async function AdminStudentDetailPage({ params }: { params: Promise<{ id: string; studentId: string }> }) {
  const session = await requireArea("admin");
  const { id, studentId } = await params;
  const actor = { ...session.user };
  const [school, student, classes] = await Promise.all([
    getSchoolSummaryForAdmin(actor, id),
    getStudent({ actor, schoolId: id, studentId }),
    listClassGroups({ actor, schoolId: id }),
  ]);
  const activeClasses = classes.filter((group) => group.status === "ACTIVE" && group.academicYear.status === "ACTIVE");
  return (
    <AppShell areaLabel="Administração" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel={`SEMED · ${school.name}`}>
      <StudentDetail student={student} schoolId={school.id} activeClasses={activeClasses} backHref={`/admin/escolas/${school.id}/alunos`} canResetPassword />
    </AppShell>
  );
}
