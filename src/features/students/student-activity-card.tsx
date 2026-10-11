import Link from "next/link";
import { Icon } from "@/src/components/ui/icon";

export type StudentActivitySummary = {
  id: string;
  acceptedAnswers: number;
  correctAnswers: number;
  incorrectAnswers: number;
  extraAnswers: number;
  pointsBalance: number;
  targetReachedAt: Date | null;
  activity: { id: string; title: string; targetCount: number; status: "OPEN" | "CLOSED"; classGroup: { name: string; grade: number } };
};

export function progressOf(item: StudentActivitySummary) {
  return Math.min(item.acceptedAnswers, item.activity.targetCount);
}

export function stateOf(item: StudentActivitySummary) {
  if (item.activity.status === "CLOSED") return "Encerrada";
  if (item.targetReachedAt) return "Meta cumprida";
  if (item.acceptedAnswers) return "Em andamento";
  return "Nova";
}

export function StudentActivityCard({ item, prominent = false }: { item: StudentActivitySummary; prominent?: boolean }) {
  const progress = progressOf(item);
  const percentage = Math.min(100, Math.round((progress / item.activity.targetCount) * 100));
  const state = stateOf(item);
  const remaining = Math.max(0, item.activity.targetCount - progress);
  return <article className={`student-card overflow-hidden ${prominent ? "" : "p-5"}`}>
    {prominent ? <div className="h-2 bg-brand" /> : null}
    <div className={prominent ? "p-5 sm:p-7" : ""}>
      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-extrabold uppercase text-brand">{item.activity.classGroup.name} · {item.activity.classGroup.grade}º ano</p><h2 className={`${prominent ? "text-2xl" : "text-xl"} mt-1 font-black leading-tight`}>{item.activity.title}</h2></div><span className={`rounded-full px-3 py-1.5 text-xs font-black ${state === "Encerrada" ? "bg-slate-100 text-slate-700" : state === "Meta cumprida" ? "bg-emerald-50 text-emerald-800" : state === "Em andamento" ? "bg-amber-50 text-amber-900" : "bg-blue-50 text-brand"}`}>{state}</span></div>
      <p className="mt-4 font-bold">{state === "Meta cumprida" ? "Meta cumprida! Você pode continuar praticando." : state === "Encerrada" ? "Seu progresso foi preservado." : remaining ? `Faltam ${remaining} desafios para completar sua missão.` : "Sua missão está pronta."}</p>
      <div className="mt-4 flex items-end justify-between gap-3"><span className="font-black">{progress} de {item.activity.targetCount} desafios</span><span className="text-sm font-black text-brand">{percentage}%</span></div>
      <div className="student-progress mt-2" role="progressbar" aria-label={`Meta de ${item.activity.title}`} aria-valuemin={0} aria-valuemax={item.activity.targetCount} aria-valuenow={progress}><span style={{ width: `${percentage}%` }} /></div>
      <p className="mt-2 text-sm text-muted">{item.pointsBalance} ponto(s) nesta atividade{item.extraAnswers ? ` · ${item.extraAnswers} resposta(s) adicional(is)` : ""}.</p>
      <Link href={`/aluno/atividades/${item.activity.id}`} className={`${prominent && item.activity.status === "OPEN" ? "student-primary" : "inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-white px-4 font-extrabold text-foreground hover:bg-blue-50 hover:text-brand"} mt-5 w-full`}><Icon name={item.activity.status === "OPEN" ? "play" : "eye"} className="size-[19px]" />{item.activity.status === "OPEN" ? item.acceptedAnswers ? "Continuar missão" : "Começar missão" : "Ver progresso"}</Link>
    </div>
  </article>;
}
