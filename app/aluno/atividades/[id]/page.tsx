import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/src/components/layout/app-shell";
import { Icon } from "@/src/components/ui/icon";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { StartGameButton } from "@/src/features/games/game-panel";
import { AuthorizationError } from "@/src/server/auth/errors";
import { requireArea } from "@/src/server/auth/guard";
import { getStudentActivity } from "@/src/server/activities/service";
import { getActiveGameForActivity } from "@/src/server/games/service";

const navigation = [{ href: "/aluno", label: "Início" }, { href: "/aluno/atividades", label: "Atividades" }, { href: "/aluno/ranking", label: "Ranking" }];

export default async function StudentActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireArea("aluno");
  const { id } = await params;
  const actor = { ...session.user };
  let item;
  try { item = await getStudentActivity({ actor, activityId: id }); }
  catch (error) { if (error instanceof AuthorizationError && (error.code === "NOT_FOUND" || error.code === "FORBIDDEN")) notFound(); throw error; }
  const game = item.activity.status === "OPEN" ? await getActiveGameForActivity({ actor, activityId: id }) : null;
  const target = Math.min(item.acceptedAnswers, item.activity.targetCount);
  const percentage = Math.min(100, Math.round((target / item.activity.targetCount) * 100));
  const met = Boolean(item.targetReachedAt);
  const context = `${item.activity.classGroup.name} · ${item.activity.classGroup.grade}º ano`;

  return <AppShell areaLabel="Aluno" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel={context}>
    <div className="space-y-6">
      <header><Link href="/aluno/atividades" className="inline-flex min-h-11 items-center gap-2 font-extrabold text-brand"><Icon name="arrow-left" />Voltar às atividades</Link><div className="mt-3 flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-black uppercase text-brand">{context}</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">{item.activity.title}</h1><p className="mt-2 text-muted">Meta de {item.activity.targetCount} desafios aceitos</p></div><span className={`rounded-full px-3 py-2 text-sm font-black ${item.activity.status === "CLOSED" ? "bg-slate-100 text-slate-700" : met ? "bg-emerald-50 text-emerald-800" : "bg-blue-50 text-brand"}`}>{item.activity.status === "CLOSED" ? "Encerrada" : met ? "Meta cumprida" : item.acceptedAnswers ? "Em andamento" : "Nova"}</span></div></header>

      <section className="student-card p-5" aria-labelledby="progress-title"><div className="flex items-center justify-between gap-3"><h2 id="progress-title" className="text-xl font-black">Seu progresso</h2><strong className="text-brand">{percentage}%</strong></div><p className="mt-3 font-black">{target} de {item.activity.targetCount} desafios</p><div className="student-progress mt-2" role="progressbar" aria-label="Progresso da missão" aria-valuemin={0} aria-valuemax={item.activity.targetCount} aria-valuenow={target}><span style={{ width: `${percentage}%` }} /></div><p className="mt-3 font-bold">{met ? "Meta cumprida — você pode continuar praticando." : item.acceptedAnswers ? `Faltam ${item.activity.targetCount - target} desafios para completar a missão.` : "Sua missão está pronta para começar."}</p><dl className="mt-5 grid grid-cols-4 gap-3 border-t border-[#e2e9f3] pt-4 text-center"><div><dt className="text-sm text-muted">Certas</dt><dd className="text-xl font-black">{item.correctAnswers}</dd></div><div><dt className="text-sm text-muted">Para revisar</dt><dd className="text-xl font-black">{item.incorrectAnswers}</dd></div><div><dt className="text-sm text-muted">Adicionais</dt><dd className="text-xl font-black">{item.extraAnswers}</dd></div><div><dt className="text-sm text-muted">Pontos</dt><dd className="text-xl font-black text-brand">{item.pointsBalance}</dd></div></dl></section>

      {item.activity.status === "CLOSED" ? <p role="status" className="student-card bg-blue-50 p-5 font-bold">Esta atividade foi encerrada pelo professor. Seu progresso continua salvo.</p> : game ? <section className="student-card p-5 sm:p-6"><span className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-brand"><Icon name="play" className="size-6" /></span><h2 className="mt-4 text-xl font-black">Sua partida está salva</h2><p className="mb-5 mt-2 text-muted">Retome exatamente da revisão {game.revision}, inclusive após atualizar a página.</p><Link href={`/aluno/atividades/${id}/jogo`} className="student-primary w-full px-5"><Icon name="play" />Retomar partida</Link></section> : <section className="student-card p-5 sm:p-6"><span className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-brand"><Icon name="play" className="size-6" /></span><h2 className="mt-4 text-xl font-black">Praticar com Ludo</h2><p className="mb-5 mt-2 text-muted">A partida é salva no servidor. Você poderá voltar do mesmo ponto nesta missão.</p><StartGameButton activityId={id} /></section>}
    </div>
  </AppShell>;
}
