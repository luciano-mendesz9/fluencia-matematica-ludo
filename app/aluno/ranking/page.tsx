import { AppShell } from "@/src/components/layout/app-shell";
import { StudentAvatar } from "@/src/components/students/student-avatar";
import { DEFAULT_AVATAR } from "@/src/domain/avatar";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { STUDENT_NAVIGATION } from "@/src/features/students/navigation";
import { requireArea } from "@/src/server/auth/guard";
import { getStudentMonthlyRanking } from "@/src/server/rankings/service";

const medal = (position: number) => position === 1 ? "👑" : position === 2 ? "🥈" : position === 3 ? "🥉" : null;

export default async function StudentRankingPage() {
  const session = await requireArea("aluno");
  const ranking = await getStudentMonthlyRanking({ actor: { ...session.user } });
  const context = `${ranking.classGroup.name} · ${ranking.classGroup.grade}º ano`;
  const podium = [2, 1, 3].map((position) => ranking.entries.find((entry) => entry.position === position)).filter(Boolean);
  return <AppShell areaLabel="Aluno" currentUserLabel={session.user.name} navigation={[...STUDENT_NAVIGATION]} accountAction={<LogoutForm />} statusLabel={context}>
    <div className="space-y-7">
      <header className="student-page-header"><p>A elite dos números</p><h1>Ranking da turma 🏆</h1><span>{context} · {ranking.monthLabel}</span></header>
      <h2 className="sr-only">Ranking de {ranking.monthLabel}</h2>
      {podium.length ? <section className="student-panel" aria-labelledby="podium-title"><h2 id="podium-title" className="mb-6 text-center text-sm font-black uppercase tracking-wider text-amber-700">✨ Os 3 primeiros lugares</h2><div className="podium-grid">{podium.map((entry) => entry ? <div key={`${entry.position}-${entry.name}`} className={`podium-entry podium-${entry.position}`}><span className="text-3xl" aria-hidden="true">{medal(entry.position)}</span><div className="podium-avatar"><StudentAvatar avatar={entry.avatar ?? DEFAULT_AVATAR} label={`Avatar de ${entry.name}`} /></div><strong className={entry.isCurrentStudent ? "text-brand" : ""}>{entry.isCurrentStudent ? "Você · " : ""}{entry.name}</strong><small>{entry.points} XP</small><div className="podium-step"><b>{entry.position}</b></div></div> : null)}</div><p className="rounded-b-2xl bg-slate-50 py-3 text-center text-sm font-black text-muted">Todo ponto conta. Continue evoluindo! 💙</p></section> : null}
      <section aria-labelledby="ranking-list-title"><h2 id="ranking-list-title" className="student-list-title">Classificação geral</h2><ol className="student-ranking-list">{ranking.entries.map((entry, index) => <li key={`${entry.name}-${index}`} className={entry.isCurrentStudent ? "is-current" : ""}><span className="ranking-number" aria-label={`${entry.position}ª posição`}>{medal(entry.position) ?? `${entry.position}º`}</span><span className="ranking-avatar"><StudentAvatar avatar={entry.avatar ?? DEFAULT_AVATAR} /></span><span className="min-w-0"><strong>{entry.name}{entry.isCurrentStudent ? <em>Você</em> : null}</strong><small>{entry.rankIcon} {entry.rankName}</small></span><b><span>{entry.points}</span> XP</b></li>)}</ol></section>
      <p className="student-info-banner text-sm font-bold"><span aria-hidden="true">💙</span><span>O ranking valoriza sua dedicação. Empates ocupam a mesma posição e somente os pontos deste mês entram na classificação; seu XP total e sua patente nunca são apagados.</span></p>
    </div>
  </AppShell>;
}
