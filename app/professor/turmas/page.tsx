import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { SchoolSwitcher } from "@/src/features/schools/school-forms";
import { requireArea } from "@/src/server/auth/guard";
import { listAssignedClasses } from "@/src/server/people/service";
import { listAvailableSchools } from "@/src/server/schools/service";

const navigation = [
  { href: "/professor", label: "Visão geral" },
  { href: "/professor/turmas", label: "Minhas turmas" },
  { href: "/questoes", label: "Banco de questões" },
];

export default async function TeacherClassesPage() {
  const session = await requireArea("professor");
  const school = session.schoolContext!;
  const [assignments, schools] = await Promise.all([
    listAssignedClasses({ actor: { ...session.user }, schoolId: school.schoolId }),
    listAvailableSchools(session.user.id),
  ]);
  return (
    <AppShell areaLabel="Professor" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} contextAction={<SchoolSwitcher userId={session.user.id} schools={schools} currentSchoolId={school.schoolId} />} statusLabel={school.schoolName}>
      <h1 className="text-3xl font-bold text-foreground">Minhas turmas</h1>
      <p className="mt-2 text-muted">Somente atribuições vigentes na escola selecionada são exibidas.</p>
      {assignments.length === 0 ? <p className="mt-6 rounded-panel border border-border bg-surface p-5 text-muted">Nenhuma turma atribuída nesta escola.</p> : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {assignments.map((assignment) => (
            <li key={assignment.id} className="rounded-panel border border-border bg-surface p-5">
              <h2 className="text-lg font-bold text-foreground">{assignment.classGroup.name}</h2>
              <p className="mt-1 text-sm text-muted">{assignment.classGroup.grade}º ano · {assignment.classGroup.academicYear.year}</p>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
