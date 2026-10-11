import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { RankingTable } from "@/src/features/rankings/ranking-table";
import { requireArea } from "@/src/server/auth/guard";
import { getStudentMonthlyRanking } from "@/src/server/rankings/service";

const navigation = [{ href: "/aluno", label: "Início" }, { href: "/aluno/atividades", label: "Atividades" }, { href: "/aluno/ranking", label: "Ranking" }];

export default async function StudentRankingPage() {
  const session = await requireArea("aluno");
  const ranking = await getStudentMonthlyRanking({ actor: { ...session.user } });
  const context = `${ranking.classGroup.name} · ${ranking.classGroup.grade}º ano`;
  return <AppShell areaLabel="Aluno" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel={context}>
    <div className="mx-auto max-w-3xl space-y-5">
      <header><p className="font-extrabold uppercase text-brand">Classificação da turma</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">Ranking de {ranking.monthLabel}</h1><p className="mt-2 text-muted">{context} · os pontos recomeçam visualmente a cada mês, sem apagar seu histórico.</p></header>
      <section aria-labelledby="ranking-list-title"><h2 id="ranking-list-title" className="sr-only">Posições do ranking</h2><RankingTable entries={ranking.entries} student /></section>
      <p className="student-card bg-blue-50 p-4 text-sm font-semibold text-muted">Empates ocupam a mesma posição. Somente os pontos conquistados neste mês entram nesta classificação.</p>
    </div>
  </AppShell>;
}
