import Link from "next/link";
import { AppShell } from "@/src/components/layout/app-shell";
import { StudentAvatar } from "@/src/components/students/student-avatar";
import { DEFAULT_AVATAR } from "@/src/domain/avatar";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { STUDENT_NAVIGATION } from "@/src/features/students/navigation";
import { requireArea } from "@/src/server/auth/guard";
import { getStudentGamification, listStudentMinigames } from "@/src/server/gamification/service";
import { getStudentMonthlyRanking } from "@/src/server/rankings/service";

export default async function StudentPage() {
  const session = await requireArea("aluno");
  const actor = { ...session.user };
  const [progress, games, ranking] = await Promise.all([
    getStudentGamification({ actor }),
    listStudentMinigames({ actor }),
    getStudentMonthlyRanking({ actor }),
  ]);
  const firstName = session.user.name.split(/\s+/)[0] ?? session.user.name;
  const ludo = games.find((game) => game.slug === "ludo");
  const maxWeekXp = Math.max(...progress.week.map((day) => day.xp), 1);
  const unlockedAchievements = progress.achievements.filter((achievement) => achievement.unlocked).slice(0, 3);

  return <AppShell areaLabel="Aluno" currentUserLabel={session.user.name} navigation={[...STUDENT_NAVIGATION]} accountAction={<LogoutForm />} statusLabel={`${progress.classGroup.name} · ${progress.classGroup.grade}º ano`}>
    <h1 className="sr-only">Área do aluno</h1>
    <div className="student-dashboard space-y-7">
      <section className="student-hero" aria-labelledby="welcome-title">
        <div className="student-hero-copy">
          <p className="student-eyebrow">Mais um dia para evoluir</p>
          <h2 id="welcome-title">Olá, {firstName}! <span aria-hidden="true">👋</span></h2>
          <p>Preparado para uma nova aventura matemática?</p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/16 px-3 py-2 text-xs font-black"><span>{progress.rank.current.icon}</span>Nível {progress.rank.current.level} · {progress.rank.current.name}</div>
          <div className="mt-3 max-w-xs"><div className="mb-1.5 flex justify-between text-xs font-extrabold"><span>{progress.rank.next ? `Rumo à patente ${progress.rank.next.name}` : "Patente máxima"}</span><span>{progress.rank.progressPercent}%</span></div><div className="h-2.5 overflow-hidden rounded-full bg-white/25"><span className="block h-full rounded-full bg-gradient-to-r from-cyan-200 to-lime-200" style={{ width: `${progress.rank.progressPercent}%` }} /></div></div>
        </div>
        <div className="student-hero-avatar"><div className="student-hero-orb" /><StudentAvatar avatar={progress.profile} className="relative z-10 size-full" /><span className="student-xp-bubble">+XP</span></div>
      </section>

      <section className="student-stat-grid" aria-label="Resumo do progresso">
        <div><span aria-hidden="true">⚡</span><strong>{progress.totalXp}</strong><small>XP total</small></div>
        <div><span aria-hidden="true">🏆</span><strong>{progress.rankingPosition ? `#${progress.rankingPosition}` : "—"}</strong><small>Na turma</small></div>
        <div><span aria-hidden="true">🔥</span><strong>{progress.dailyStreak} {progress.dailyStreak === 1 ? "dia" : "dias"}</strong><small>Sequência</small></div>
      </section>

      <section aria-labelledby="mission-title">
        <div className="student-section-heading"><div><p>Próxima aventura</p><h2 id="mission-title">Missão do dia 🚀</h2></div><span className={`student-status-pill ${ludo?.unlocked ? "is-open" : ""}`}>{ludo?.unlocked ? "Ativa" : "Aguardando"}</span></div>
        <article className={`mission-card ${ludo?.unlocked ? "is-unlocked" : "is-locked"}`}>
          <div><p className="mission-kicker">{ludo?.mission ? `Ludo · Liberado por ${ludo.mission.teacherName}` : "Aguardando uma atividade do professor"}</p><h3>{ludo?.mission?.title ?? "Ludo matemático"}</h3><p>Avance pelo tabuleiro resolvendo os desafios da sua turma.</p>{ludo?.unlocked && ludo.mission ? <Link href={`/aluno/atividades/${ludo.mission.activityId}`} aria-label="Começar missão" className="student-primary mt-5 px-5">Jogar agora <span aria-hidden="true">→</span></Link> : <span className="student-locked-button mt-5"><span aria-hidden="true">🔒</span> Bloqueado</span>}</div>
          <div className="mission-art" aria-hidden="true"><span>{ludo?.icon ?? "🎲"}</span></div>
        </article>
      </section>

      <section aria-labelledby="games-title">
        <div className="student-section-heading"><div><h2 id="games-title">Arena de jogos 🎮</h2><p>Os jogos são liberados pelas atividades do professor.</p></div><Link href="/aluno/jogos">Ver todos →</Link></div>
        <div className="game-showcase-grid">{games.slice(0, 2).map((game) => <article key={game.id} className="student-game-card"><span className="student-game-icon">{game.icon}</span><span className="student-card-lock" aria-label={game.unlocked ? "Liberado" : "Bloqueado"}>{game.unlocked ? "✓" : "🔒"}</span><h3>{game.name}</h3><p>{game.description}</p>{game.unlocked && game.mission ? <Link href={`/aluno/atividades/${game.mission.activityId}`}>Jogar →</Link> : <span>{game.comingSoon ? "Em breve" : "Aguardando"}</span>}</article>)}</div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="student-panel" aria-labelledby="week-title"><div className="student-panel-title"><div><p>Seu progresso</p><h2 id="week-title">Semana incrível!</h2></div><span aria-hidden="true">📈</span></div><div className="mt-5 flex items-end gap-2"><strong className="text-4xl text-brand">{progress.weeklyXp}</strong><span className="pb-1 text-sm font-extrabold text-muted">XP nos últimos 7 dias</span></div><div className="week-chart mt-5">{progress.week.map((day) => <div key={day.key}><span style={{ height: `${Math.max(8, Math.round((day.xp / maxWeekXp) * 100))}%` }} className={day.xp ? "has-xp" : ""} /><small>{day.label}</small></div>)}</div></section>
        <section className="student-panel" aria-labelledby="achievements-title"><div className="student-panel-title"><div><p>Colecione vitórias</p><h2 id="achievements-title">Minhas conquistas</h2></div><span aria-hidden="true">🏅</span></div>{unlockedAchievements.length ? <div className="achievement-preview">{unlockedAchievements.map((achievement) => <div key={achievement.id}><span>{achievement.icon}</span><strong>{achievement.title}</strong></div>)}</div> : <p className="mt-5 rounded-2xl bg-blue-50 p-4 font-bold text-muted">Suas primeiras medalhas estão bem perto. Complete desafios para desbloqueá-las.</p>}<Link href="/aluno/conquistas" className="student-soft-button mt-5">Ver álbum de conquistas →</Link></section>
      </div>

      <section className="student-panel" aria-labelledby="ranking-preview-title"><div className="student-section-heading"><div><h2 id="ranking-preview-title">Top da turma 🏅</h2><p>{ranking.classGroup.name} · {ranking.monthLabel}</p></div><Link href="/aluno/ranking">Ver ranking →</Link></div><div className="mt-4 grid gap-2 sm:grid-cols-3">{ranking.entries.slice(0, 3).map((entry) => <div key={`${entry.position}-${entry.name}`} className={`ranking-preview-row ${entry.isCurrentStudent ? "is-current" : ""}`}><div className="size-12 overflow-hidden rounded-full bg-blue-50"><StudentAvatar avatar={entry.avatar ?? DEFAULT_AVATAR} /></div><div className="min-w-0"><strong className="block truncate">{entry.position}º · {entry.name}</strong><span>{entry.points} XP · {entry.rankIcon} {entry.rankName}</span></div></div>)}</div></section>
    </div>
  </AppShell>;
}
