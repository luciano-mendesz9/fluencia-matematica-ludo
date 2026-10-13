import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { ActivityManagementTable, ProgressBar, TeacherStudentTable } from "@/src/features/management/management-tables";
import { RankingTable } from "@/src/features/rankings/ranking-table";
import { SchoolSwitcher } from "@/src/features/schools/school-forms";
import { AuthorizationError } from "@/src/server/auth/errors";
import { requireArea } from "@/src/server/auth/guard";
import { getTeacherClassManagement } from "@/src/server/management/service";
import { getAuthorizedClassMonthlyRanking } from "@/src/server/rankings/service";
import { listAvailableSchools } from "@/src/server/schools/service";

const navigation = [{ href: "/professor", label: "Visão geral" }, { href: "/professor/turmas", label: "Minhas turmas" }, { href: "/atividades", label: "Atividades" }, { href: "/professor/relatorios", label: "Resultados" }, { href: "/questoes", label: "Banco de questões" }];

export default async function TeacherClassPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireArea("professor");
  const school = session.schoolContext!;
  const { id } = await params;
  let overview;
  try { overview = await getTeacherClassManagement({ actor: { ...session.user }, schoolId: school.schoolId, classId: id }); }
  catch (error) { if (error instanceof AuthorizationError && ["NOT_FOUND", "FORBIDDEN"].includes(error.code)) notFound(); throw error; }
  const [schools, ranking] = await Promise.all([listAvailableSchools(session.user.id), getAuthorizedClassMonthlyRanking({ actor: { ...session.user }, schoolId: school.schoolId, classId: id })]);
  return <AppShell areaLabel="Professor" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} contextAction={<SchoolSwitcher userId={session.user.id} schools={schools} currentSchoolId={school.schoolId} />} statusLabel={school.schoolName}>
    <div className="space-y-9"><header><Link href="/professor/turmas" className="font-bold text-brand">← Voltar às turmas</Link><p className="mt-5 text-sm font-bold uppercase tracking-[0.12em] text-brand">Visão geral da turma</p><h1 className="mt-1 text-3xl font-bold">{overview.group.name}</h1><p className="mt-2 text-muted">{overview.group.grade}º ano · {overview.group.academicYear.year}. Indicadores calculados somente sobre suas atividades nesta turma.</p></header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo da turma"><div className="adult-card p-5"><p className="text-sm font-semibold text-muted">Alunos ativos</p><p className="mt-2 text-3xl font-extrabold">{overview.summary.students}</p></div><div className="adult-card p-5"><p className="text-sm font-semibold text-muted">Atividades abertas</p><p className="mt-2 text-3xl font-extrabold">{overview.summary.openActivities}</p></div><div className="adult-card p-5"><p className="text-sm font-semibold text-muted">Participação</p><div className="mt-3"><ProgressBar value={overview.summary.participationPercent} label="Participação da turma" /></div><p className="mt-2 text-xs text-muted">Alunos com ao menos uma resposta nas suas atividades.</p></div><div className="adult-card p-5"><p className="text-sm font-semibold text-muted">Precisão</p><div className="mt-3"><ProgressBar value={overview.summary.precisionPercent} label="Precisão da turma" /></div><p className="mt-2 text-xs text-muted">{overview.summary.answers} respostas aceitas.</p></div></section>
      <TeacherStudentTable students={overview.students} detailBasePath={`/professor/turmas/${id}`} />
      <ActivityManagementTable activities={overview.activities.map((activity) => ({ ...activity, classGroup: { name: overview.group.name }, participationPercent: activity.recipients ? Math.round((activity.participants / activity.recipients) * 1000) / 10 : null }))} showClass={false} />
      <details className="rounded-panel border border-border bg-surface p-5"><summary className="cursor-pointer text-lg font-bold">Ranking mensal de {ranking.monthLabel}</summary><p className="mb-4 mt-2 text-sm text-muted">O ranking representa pontos e volume de prática; não é medida de domínio ou nota.</p><RankingTable entries={ranking.entries} /></details>
    </div>
  </AppShell>;
}
