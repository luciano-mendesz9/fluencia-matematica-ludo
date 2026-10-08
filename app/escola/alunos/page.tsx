import Link from "next/link";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { schoolNavigation } from "@/src/features/academics/navigation";
import { SchoolSwitcher } from "@/src/features/schools/school-forms";
import { StudentList } from "@/src/features/students/student-list";
import { requireArea } from "@/src/server/auth/guard";
import { listAvailableSchools } from "@/src/server/schools/service";
import { listStudents } from "@/src/server/students/service";

export default async function StudentsPage() {
  const session = await requireArea("escola");
  const school = session.schoolContext!;
  const [students, schools] = await Promise.all([
    listStudents({ actor: { ...session.user }, schoolId: school.schoolId }),
    listAvailableSchools(session.user.id),
  ]);
  return (
    <AppShell areaLabel="Coordenação" currentUserLabel={session.user.name} navigation={schoolNavigation} accountAction={<LogoutForm />} contextAction={<SchoolSwitcher userId={session.user.id} schools={schools} currentSchoolId={school.schoolId} />} statusLabel={school.schoolName}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alunos</h1>
          <p className="mt-2 text-muted">Cadastro individual e histórico de matrículas de {school.schoolName}.</p>
        </div>
        <Link href="/escola/alunos/novo" className="inline-flex min-h-11 items-center rounded-control border border-brand bg-brand px-5 font-semibold text-white hover:bg-brand-hover">Cadastrar aluno</Link>
      </div>
      <div className="mt-6"><StudentList students={students} detailBasePath="/escola/alunos" /></div>
    </AppShell>
  );
}
