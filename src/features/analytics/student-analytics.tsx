import type { getStudentAnalytics } from "@/src/server/analytics/service";
import { Feedback } from "@/src/components/ui/feedback";

type Result = Awaited<ReturnType<typeof getStudentAnalytics>>;
const pct = (value: number | null) => value === null ? "—" : `${value.toLocaleString("pt-BR")}%`;

export function StudentAnalytics({ result }: { result: Result }) {
  return <div className="space-y-7">
    <header><p className="font-extrabold uppercase text-brand">Seu progresso</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">Como foi sua prática</h1><p className="mt-2 max-w-2xl text-muted">Veja respostas e cobertura separadas dos pontos. Estes números ajudam a revisar, mas não são nota.</p></header>
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[
      ["Respostas", result.summary.answers, "aceitas"],
      ["Acertos", result.summary.correct, `de ${result.summary.answers}`],
      ["Precisão", pct(result.summary.precisionPercent), "acertos / respostas"],
      ["Adicionais", result.summary.extraAnswers, "depois da meta"],
    ].map(([label, value, detail]) => <div key={label} className="student-card p-4"><dt className="text-sm font-bold text-muted">{label}</dt><dd className="mt-1 text-2xl font-black">{value}</dd><dd className="text-xs text-muted">{detail}</dd></div>)}</dl>
    {result.summary.answers === 0 ? <Feedback title="Você ainda não respondeu questões" variant="info">Depois de praticar em uma atividade, seus resultados aparecerão aqui.</Feedback> : null}
    <section aria-labelledby="student-coverage"><h2 id="student-coverage" className="text-xl font-black">Temas e habilidades praticados</h2><div className="mt-3 grid gap-3">{result.groups.map((group) => <article key={group.key} className="student-card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black">{group.skillName ?? group.themeName}</h3><p className="text-sm text-muted">{group.themeName} · dificuldade {group.difficulty}</p></div><p className="font-black text-brand">{pct(group.precisionPercent)}</p></div><p className="mt-3 text-sm text-muted">{group.correct} acertos em {group.answers} respostas · {group.distinctQuestions} questões diferentes · {group.repetitions} repetições.</p></article>)}{result.groups.length === 0 ? <p className="text-muted">Nenhum resultado disponível.</p> : null}</div></section>
    <section aria-labelledby="student-feedback"><h2 id="student-feedback" className="text-xl font-black">Observações para revisar</h2><p className="mt-1 text-sm text-muted">As sugestões usam regras transparentes e nunca afirmam que você domina ou não domina um conteúdo.</p><div className="mt-3 grid gap-3">{result.feedback.slice(0, 8).map((item, index) => <article key={`${item.skillId ?? item.themeName}-${item.difficulty}-${index}`} className="student-card p-5"><h3 className="font-black">{item.skillName ?? item.themeName} · dificuldade {item.difficulty}</h3><p className="mt-2 text-sm leading-6 text-muted">{item.message}</p><p className="mt-2 text-xs text-muted">Base: {item.distinctQuestions} questões diferentes; repetições são mostradas separadamente.</p></article>)}</div></section>
  </div>;
}
