import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { STUDENT_NAVIGATION } from "@/src/features/students/navigation";
import { requireArea } from "@/src/server/auth/guard";
import { getStudentGamification } from "@/src/server/gamification/service";

export default async function StudentAchievementsPage() {
  const session = await requireArea("aluno");
  const progress = await getStudentGamification({ actor: { ...session.user } });
  const unlocked = progress.achievements.filter((achievement) => achievement.unlocked);
  const locked = progress.achievements.filter((achievement) => !achievement.unlocked);
  const completion = progress.achievements.length ? Math.round((unlocked.length / progress.achievements.length) * 100) : 0;
  return <AppShell areaLabel="Aluno" currentUserLabel={session.user.name} navigation={[...STUDENT_NAVIGATION]} accountAction={<LogoutForm />} statusLabel="Conquistas">
    <div className="space-y-7">
      <header className="student-page-header"><p>Seu álbum de glórias</p><h1>Conquistas 🏅</h1><span>Cada medalha registra uma meta alcançada de verdade.</span></header>
      <section className="student-panel"><div className="flex items-center justify-between gap-4"><div><p className="font-extrabold text-muted">Seu álbum de medalhas</p><h2 className="mt-1 text-3xl font-black">{unlocked.length} <span className="text-lg text-muted">/ {progress.achievements.length} desbloqueadas</span></h2></div><span className="grid size-16 place-items-center rounded-2xl bg-amber-50 text-4xl">🏆</span></div><div className="student-progress mt-5" role="progressbar" aria-label="Álbum de conquistas" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion}><span style={{ width: `${completion}%` }} /></div><p className="mt-2 text-sm font-bold text-muted">{completion}% do álbum completo.</p></section>
      {unlocked.length ? <section aria-labelledby="earned-title"><h2 id="earned-title" className="student-list-title">Minhas medalhas ✨</h2><div className="achievements-grid">{unlocked.map((achievement) => <article key={achievement.id} className="achievement-card is-earned"><span>{achievement.icon}</span><h3>{achievement.title}</h3><p>{achievement.description}</p><strong>✓ Conquistada</strong></article>)}</div></section> : null}
      <section aria-labelledby="next-title"><h2 id="next-title" className="student-list-title">Próximas conquistas 🔒</h2>{locked.length ? <div className="achievements-grid">{locked.map((achievement) => <article key={achievement.id} className="achievement-card is-locked"><span>{achievement.icon}</span><h3>{achievement.title}</h3><p>{achievement.description}</p><strong>🔒 Bloqueada</strong></article>)}</div> : <div className="student-panel text-center"><span className="text-5xl">🎉</span><h3 className="mt-3 text-2xl font-black">Álbum completo!</h3><p className="mt-2 font-bold text-muted">Você conquistou todas as medalhas disponíveis.</p></div>}</section>
    </div>
  </AppShell>;
}
