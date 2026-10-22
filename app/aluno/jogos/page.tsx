import Link from "next/link";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { STUDENT_NAVIGATION } from "@/src/features/students/navigation";
import { requireArea } from "@/src/server/auth/guard";
import { listStudentMinigames } from "@/src/server/gamification/service";

export default async function StudentGamesPage() {
  const session = await requireArea("aluno");
  const games = await listStudentMinigames({ actor: { ...session.user } });
  const released = games.filter((game) => game.unlocked);
  const upcoming = games.filter((game) => !game.unlocked);
  return <AppShell areaLabel="Aluno" currentUserLabel={session.user.name} navigation={[...STUDENT_NAVIGATION]} accountAction={<LogoutForm />} statusLabel="Arena de jogos">
    <div className="space-y-7">
      <header className="student-page-header"><p>Escolha sua aventura</p><h1>Arena de jogos 🎮</h1><span>Aprender brincando fica muito mais divertido.</span></header>
      <section className="student-info-banner"><span aria-hidden="true">💡</span><div><h2>O professor comanda a partida</h2><p>Um minigame é liberado aqui quando há uma atividade aberta para sua turma. Fechar a atividade também encerra o acesso.</p></div></section>
      {released.length ? <section aria-labelledby="released-games"><div className="student-section-heading"><div><h2 id="released-games">Liberados para você ✨</h2><p>Continue de onde parou; o progresso fica salvo.</p></div></div><div className="game-list-grid">{released.map((game) => <article key={game.id} className="student-game-list-card is-open"><div className="student-game-list-icon">{game.icon}</div><div><span className="game-state-open">● Liberado</span><h3>{game.name}</h3><p>{game.mission?.title} · Prof. {game.mission?.teacherName}</p><Link href={`/aluno/atividades/${game.mission!.activityId}`} className="student-primary mt-4 px-5">Jogar agora →</Link></div></article>)}</div></section> : null}
      <section aria-labelledby="upcoming-games"><div className="student-section-heading"><div><h2 id="upcoming-games">Próximas missões 🔒</h2><p>O Ludo depende de uma atividade; a Corrida Matemática chegará em uma futura versão.</p></div></div><div className="game-list-grid">{upcoming.map((game) => <article key={game.id} className="student-game-list-card"><div className="student-game-list-icon">{game.icon}</div><div><span className="game-state-locked">🔒 {game.comingSoon ? "EM DESENVOLVIMENTO" : "Aguardando atividade"}</span><h3>{game.name}</h3><p>{game.description}</p><span className="student-locked-button mt-4">Bloqueado</span></div></article>)}</div></section>
      <Link href="/aluno/atividades" className="student-soft-button">Ver histórico de atividades →</Link>
    </div>
  </AppShell>;
}
