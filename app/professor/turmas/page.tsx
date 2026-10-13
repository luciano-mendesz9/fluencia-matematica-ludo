import Link from "next/link";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { SchoolSwitcher } from "@/src/features/schools/school-forms";
import { requireArea } from "@/src/server/auth/guard";
import { getTeacherManagementOverview } from "@/src/server/management/service";
import { listAvailableSchools } from "@/src/server/schools/service";

const navigation = [{ href: "/professor", label: "Visão geral" }, { href: "/professor/turmas", label: "Minhas turmas" }, { href: "/atividades", label: "Atividades" }, { href: "/professor/relatorios", label: "Resultados" }, { href: "/questoes", label: "Banco de questões" }];

export default async function TeacherClassesPage() {
  const session = await requireArea("professor");
  const school = session.schoolContext!;
  const [overview, schools] = await Promise.all([
    getTeacherManagementOverview({ actor: { ...session.user }, schoolId: school.schoolId }),
    listAvailableSchools(session.user.id),
  ]);
  return <AppShell areaLabel="Professor" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} contextAction={<SchoolSwitcher userId={session.user.id} schools={schools} currentSchoolId={school.schoolId} />} statusLabel={school.schoolName}>
    <header><p className="text-sm font-bold uppercase tracking-[0.12em] text-brand">Gestão das turmas</p><h1 className="mt-2 text-3xl font-bold">Minhas turmas</h1><p className="mt-2 max-w-3xl text-muted">Acesse alunos, participação, desempenho, atividades e ranking. Somente atribuições vigentes e validadas no servidor são exibidas.</p></header>
    <div className="mt-6 overflow-x-auto rounded-panel border border-border bg-surface"><table className="min-w-full text-left text-sm"><thead className="bg-blue-50"><tr><th className="px-4 py-3">Turma</th><th className="px-4 py-3">Ano letivo</th><th className="px-4 py-3">Alunos ativos</th><th className="px-4 py-3"><span className="sr-only">Ação</span></th></tr></thead><tbody>{overview.assignments.map((assignment) => <tr key={assignment.id} className="border-t border-border"><th className="px-4 py-3 font-semibold">{assignment.classGroup.name}<span className="block text-xs font-normal text-muted">{assignment.classGroup.grade}º ano</span></th><td className="px-4 py-3">{assignment.classGroup.academicYear.year}</td><td className="px-4 py-3">{assignment.classGroup.enrollments.length}</td><td className="px-4 py-3 text-right"><Link href={`/professor/turmas/${assignment.classId}`} className="inline-flex min-h-11 items-center font-bold text-brand hover:underline">Acompanhar turma →</Link></td></tr>)}{overview.assignments.length === 0 ? <tr><td colSpan={4} className="px-4 py-10 text-center text-muted">Nenhuma turma atribuída nesta escola.</td></tr> : null}</tbody></table></div>
  </AppShell>;
}
