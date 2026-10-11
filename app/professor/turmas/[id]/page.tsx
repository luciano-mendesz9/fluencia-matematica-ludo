import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { RankingTable } from "@/src/features/rankings/ranking-table";
import { SchoolSwitcher } from "@/src/features/schools/school-forms";
import { AuthorizationError } from "@/src/server/auth/errors";
import { requireArea } from "@/src/server/auth/guard";
import { getAuthorizedClassMonthlyRanking } from "@/src/server/rankings/service";
import { listAvailableSchools } from "@/src/server/schools/service";

const navigation = [{ href: "/professor", label: "Visão geral" }, { href: "/professor/turmas", label: "Minhas turmas" }, { href: "/questoes", label: "Banco de questões" }, { href: "/atividades", label: "Atividades" }];

export default async function TeacherClassRankingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireArea("professor");
  const school = session.schoolContext!;
  const { id } = await params;
  let ranking;
  try { ranking = await getAuthorizedClassMonthlyRanking({ actor: { ...session.user }, schoolId: school.schoolId, classId: id }); }
  catch (error) { if (error instanceof AuthorizationError && ["NOT_FOUND", "FORBIDDEN"].includes(error.code)) notFound(); throw error; }
  const schools = await listAvailableSchools(session.user.id);
  return <AppShell areaLabel="Professor" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} contextAction={<SchoolSwitcher userId={session.user.id} schools={schools} currentSchoolId={school.schoolId} />} statusLabel={school.schoolName}>
    <Link href="/professor/turmas" className="inline-flex min-h-11 items-center font-bold text-brand">← Voltar às turmas</Link>
    <header className="mt-3"><p className="text-sm font-bold uppercase tracking-wide text-brand">Ranking de {ranking.monthLabel}</p><h1 className="mt-1 text-3xl font-bold">{ranking.classGroup.name}</h1><p className="mt-2 text-muted">{ranking.classGroup.grade}º ano · {ranking.classGroup.academicYear.year} · alunos com matrícula ativa, inclusive sem pontos.</p></header>
    <section className="mt-6 max-w-4xl" aria-labelledby="teacher-ranking-title"><h2 id="teacher-ranking-title" className="sr-only">Classificação mensal da turma</h2><RankingTable entries={ranking.entries} /></section>
  </AppShell>;
}
