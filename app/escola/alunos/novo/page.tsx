import Link from "next/link";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { schoolNavigation } from "@/src/features/academics/navigation";
import { SchoolSwitcher } from "@/src/features/schools/school-forms";
import { CreateStudentForm } from "@/src/features/students/student-forms";
import { requireArea } from "@/src/server/auth/guard";
import { listClassGroups } from "@/src/server/academics/service";
import { listAvailableSchools } from "@/src/server/schools/service";

export default async function NewStudentPage() {
  const session = await requireArea("escola");
  const school = session.schoolContext!;
  const actor = { ...session.user };
  const [classes, schools] = await Promise.all([
    listClassGroups({ actor, schoolId: school.schoolId }),
    listAvailableSchools(session.user.id),
  ]);
  const activeClasses = classes.filter((group) => group.status === "ACTIVE" && group.academicYear.status === "ACTIVE");
  return (
    <AppShell areaLabel="Coordenação" currentUserLabel={session.user.name} navigation={schoolNavigation} accountAction={<LogoutForm />} contextAction={<SchoolSwitcher userId={session.user.id} schools={schools} currentSchoolId={school.schoolId} />} statusLabel={school.schoolName}>
      <Link href="/escola/alunos" className="font-semibold text-brand hover:text-brand-hover">← Voltar aos alunos</Link>
      <section className="mt-5 max-w-2xl rounded-panel border border-border bg-surface p-5 sm:p-7" aria-labelledby="new-student-title">
        <h1 id="new-student-title" className="text-2xl font-bold text-foreground">Cadastrar aluno</h1>
        <p className="mb-6 mt-2 text-muted">O código de acesso será gerado pelo servidor e exibido uma única vez.</p>
        <CreateStudentForm schoolId={school.schoolId} classes={activeClasses} />
      </section>
    </AppShell>
  );
}
