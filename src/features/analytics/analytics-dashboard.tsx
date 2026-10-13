import Link from "next/link";
import { Feedback } from "@/src/components/ui/feedback";
import type { getAuthorizedAnalytics } from "@/src/server/analytics/service";
import { dateInputValue } from "./filters";
import { ExportButtons } from "./export-buttons";
import { FeedbackCriteria } from "./feedback-criteria";

type Result = Awaited<ReturnType<typeof getAuthorizedAnalytics>>;

const displayPercent = (value: number | null) => value === null ? "—" : `${value.toLocaleString("pt-BR")}%`;

function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return <div className="adult-card p-5"><dt className="text-sm font-semibold text-muted">{label}</dt><dd className="mt-2 text-3xl font-extrabold tracking-tight">{value}</dd><dd className="mt-1 text-sm leading-6 text-muted">{detail}</dd></div>;
}

export function AnalyticsDashboard({ result, basePath, showStudentNames = true }: { result: Result; basePath: string; showStudentNames?: boolean }) {
  const { summary, options, filters } = result;
  const exportQuery = new URLSearchParams();
  if (filters.schoolId) exportQuery.set("schoolId", filters.schoolId);
  if (filters.classId) exportQuery.set("classId", filters.classId);
  if (filters.activityId) exportQuery.set("activityId", filters.activityId);
  if (filters.studentId) exportQuery.set("studentId", filters.studentId);
  if (filters.skillId) exportQuery.set("skillId", filters.skillId);
  if (filters.difficulty) exportQuery.set("difficulty", String(filters.difficulty));
  if (filters.from) exportQuery.set("from", dateInputValue(filters.from));
  if (filters.to) exportQuery.set("to", dateInputValue(filters.to));
  const studentHref = (studentId: string) => {
    const query = new URLSearchParams();
    if (filters.schoolId && result.scope === "NETWORK") query.set("schoolId", filters.schoolId);
    if (filters.classId) query.set("classId", filters.classId);
    if (filters.activityId) query.set("activityId", filters.activityId);
    if (filters.skillId) query.set("skillId", filters.skillId);
    if (filters.difficulty) query.set("difficulty", String(filters.difficulty));
    if (filters.from) query.set("from", dateInputValue(filters.from));
    if (filters.to) query.set("to", dateInputValue(filters.to));
    query.set("studentId", studentId);
    return `${basePath}?${query.toString()}`;
  };
  return <div className="space-y-8">
    <header><p className="text-sm font-bold uppercase tracking-[0.12em] text-brand">Indicadores pedagógicos</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Participação, prática e precisão</h1><p className="mt-3 max-w-3xl leading-7 text-muted">As dimensões são exibidas separadamente. Precisão não é nota nem diagnóstico; pontos e ranking não entram nestes cálculos.</p></header>

    <form action={basePath} className="rounded-panel border border-border bg-surface p-5" aria-label="Filtros dos indicadores">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {result.scope === "NETWORK" ? <label className="text-sm font-semibold">Escola<select name="schoolId" defaultValue={filters.schoolId ?? ""} className="mt-2 min-h-11 w-full rounded-control border border-border bg-white px-3"><option value="">Toda a rede</option>{[...new Map(options.classes.map((item) => [item.schoolId, item.schoolName])).entries()].map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label> : null}
        <label className="text-sm font-semibold">Turma<select name="classId" defaultValue={filters.classId ?? ""} className="mt-2 min-h-11 w-full rounded-control border border-border bg-white px-3"><option value="">Todas as turmas autorizadas</option>{options.classes.map((item) => <option key={item.id} value={item.id}>{result.scope === "NETWORK" ? `${item.schoolName} · ` : ""}{item.name} · {item.grade}º ano</option>)}</select></label>
        <label className="text-sm font-semibold">Atividade<select name="activityId" defaultValue={filters.activityId ?? ""} className="mt-2 min-h-11 w-full rounded-control border border-border bg-white px-3"><option value="">Todas as atividades</option>{options.activities.map((item) => <option key={item.id} value={item.id}>{item.classGroup.name} · {item.title}</option>)}</select></label>
        {showStudentNames ? <label className="text-sm font-semibold">Aluno<select name="studentId" defaultValue={filters.studentId ?? ""} className="mt-2 min-h-11 w-full rounded-control border border-border bg-white px-3"><option value="">Todos os alunos</option>{options.students.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label> : null}
        <label className="text-sm font-semibold">Habilidade<select name="skillId" defaultValue={filters.skillId ?? ""} className="mt-2 min-h-11 w-full rounded-control border border-border bg-white px-3"><option value="">Todas as habilidades</option>{options.skills.map((item) => <option key={item.id} value={item.id}>{item.theme.name} · {item.name}</option>)}</select></label>
        <label className="text-sm font-semibold">Dificuldade<select name="difficulty" defaultValue={filters.difficulty?.toString() ?? ""} className="mt-2 min-h-11 w-full rounded-control border border-border bg-white px-3"><option value="">1 a 6</option>{[1,2,3,4,5,6].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label className="text-sm font-semibold">De<input name="from" type="date" defaultValue={dateInputValue(filters.from)} className="mt-2 min-h-11 w-full rounded-control border border-border bg-white px-3" /></label>
        <label className="text-sm font-semibold">Até<input name="to" type="date" defaultValue={dateInputValue(filters.to)} className="mt-2 min-h-11 w-full rounded-control border border-border bg-white px-3" /></label>
      </div>
      <div className="mt-5 flex flex-wrap gap-3"><button className="min-h-11 rounded-control bg-brand px-5 font-bold text-white hover:bg-brand-hover">Aplicar filtros</button><Link href={basePath} className="inline-flex min-h-11 items-center rounded-control border border-border px-5 font-bold text-brand">Limpar</Link></div>
    </form>

    <ExportButtons query={exportQuery.toString()} />

    <section aria-labelledby="analytics-summary"><h2 id="analytics-summary" className="mb-4 text-xl font-bold">Resumo com denominadores</h2><dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Participação" value={displayPercent(summary.participationPercent)} detail={`${summary.participants} de ${summary.recipients} destinatários-atividade responderam.`} />
      <Metric label="Meta cumprida" value={displayPercent(summary.targetPercent)} detail={`${summary.targetReached} de ${summary.recipients} destinatários-atividade atingiram a meta.`} />
      <Metric label="Precisão" value={displayPercent(summary.precisionPercent)} detail={`${summary.correct} acertos em ${summary.answers} respostas aceitas.`} />
      <Metric label="Prática adicional" value={summary.extraAnswers} detail="Respostas aceitas depois de a meta da atividade ser atingida." />
      <Metric label="Questões distintas" value={summary.distinctQuestions} detail={`${summary.repetitions} resposta(s) foram marcadas como repetição.`} />
      <Metric label="Recuperação" value={summary.recoveryAnswers} detail="Respostas após erro na mesma sequência; não prova domínio posterior." />
    </dl></section>

    {summary.answers === 0 ? <Feedback title="Sem respostas no recorte" variant="info">Os filtros são válidos, mas ainda não há respostas aceitas para calcular precisão e cobertura.</Feedback> : null}

    <section aria-labelledby="coverage-title"><h2 id="coverage-title" className="text-xl font-bold">Cobertura por habilidade e dificuldade</h2><p className="mt-1 text-sm text-muted">O gráfico visual sempre acompanha a mesma informação em tabela.</p><div tabIndex={0} aria-label="Tabela de cobertura, com rolagem horizontal" className="mt-4 overflow-x-auto rounded-panel border border-border bg-surface"><table className="min-w-full text-left text-sm"><thead className="bg-blue-50"><tr><th className="px-4 py-3">Tema / habilidade</th><th className="px-4 py-3">Dificuldade</th><th className="px-4 py-3">Precisão</th><th className="px-4 py-3">Cobertura</th><th className="px-4 py-3">Repetições</th></tr></thead><tbody>{result.groups.map((group) => <tr key={group.key} className="border-t border-border"><th className="px-4 py-3 font-semibold">{group.themeName}{group.skillName ? ` · ${group.skillName}` : " · habilidade não informada"}</th><td className="px-4 py-3">{group.difficulty}</td><td className="px-4 py-3"><span>{displayPercent(group.precisionPercent)} ({group.correct}/{group.answers})</span><span aria-hidden="true" className="mt-2 block h-2 w-32 overflow-hidden rounded-full bg-slate-100"><span className="block h-full bg-brand" style={{ width: `${group.precisionPercent ?? 0}%` }} /></span></td><td className="px-4 py-3">{group.distinctQuestions} distintas · {group.students} aluno(s)</td><td className="px-4 py-3">{group.repetitions}</td></tr>)}{result.groups.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Nenhum agrupamento disponível.</td></tr> : null}</tbody></table></div></section>

    {showStudentNames ? <section aria-labelledby="students-title"><h2 id="students-title" className="text-xl font-bold">Alunos no recorte</h2><div tabIndex={0} aria-label="Tabela de alunos, com rolagem horizontal" className="mt-4 overflow-x-auto rounded-panel border border-border bg-surface"><table className="min-w-full text-left text-sm"><thead className="bg-blue-50"><tr><th className="px-4 py-3">Aluno</th><th className="px-4 py-3">Respostas</th><th className="px-4 py-3">Precisão</th><th className="px-4 py-3">Meta</th><th className="px-4 py-3">Contexto</th></tr></thead><tbody>{result.students.map((student) => <tr key={student.studentId} className="border-t border-border"><th className="px-4 py-3 font-semibold"><Link className="text-brand hover:underline" href={studentHref(student.studentId)}>{student.studentName}</Link></th><td className="px-4 py-3">{student.answers}</td><td className="px-4 py-3">{displayPercent(student.precisionPercent)} ({student.correct}/{student.answers})</td><td className="px-4 py-3">{student.targetReached ? "Atingida" : "Ainda não"}</td><td className="px-4 py-3">{student.distinctQuestions} distintas · {student.repetitions} repetições</td></tr>)}{result.students.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Nenhum destinatário no recorte.</td></tr> : null}</tbody></table></div></section> : null}

    <section aria-labelledby="feedback-title"><h2 id="feedback-title" className="text-xl font-bold">Feedback por regras explícitas</h2><p className="mt-1 text-sm text-muted">Cada observação cita a amostra; áudio e repetição são contexto neutro. Não há classificação de domínio.</p><FeedbackCriteria policy={result.policy} className="mt-4" />{!showStudentNames ? <div className="mt-4"><Feedback title="Visão agregada da rede" variant="info">Observações individuais não são exibidas neste painel municipal. Use os agrupamentos de cobertura para analisar a rede sem expor um aluno.</Feedback></div> : null}{showStudentNames ? <div className="mt-4 grid gap-4 lg:grid-cols-2">{result.feedback.slice(0, 12).map((item, index) => <article key={`${item.studentId}-${item.skillId ?? item.themeName}-${item.difficulty}-${index}`} className="adult-card p-5"><p className="text-sm font-bold text-brand">{item.status === "REVIEW" ? "Sugestão de retomada" : item.status === "INSUFFICIENT" ? "Dados insuficientes" : "Observação"}</p><h3 className="mt-1 font-bold">{item.studentName} · {item.skillName ?? item.themeName} · dificuldade {item.difficulty}</h3><p className="mt-2 text-sm leading-6 text-muted">{item.message}</p><p className="mt-3 text-xs text-muted">Evidência: {item.distinctQuestions} questões distintas, {item.repetitions} repetições e {item.recoveryAnswers} respostas em recuperação.</p></article>)}{result.feedback.length === 0 ? <p className="text-muted">Ainda não há evidências para gerar observações.</p> : null}</div> : null}</section>

    <section className="rounded-panel border border-border bg-blue-50 p-5" aria-labelledby="definitions-title"><h2 id="definitions-title" className="font-bold">Definições do painel</h2><ul className="mt-3 grid gap-2 text-sm leading-6 text-muted sm:grid-cols-2"><li><strong>Participação:</strong> ao menos uma resposta aceita por destinatário-atividade.</li><li><strong>Meta:</strong> respostas aceitas atingiram a meta da atividade.</li><li><strong>Precisão:</strong> acertos divididos por respostas no recorte.</li><li><strong>Repetição:</strong> nova exposição à mesma versão, separada de questão distinta.</li><li><strong>Recuperação:</strong> respostas depois de erro na sequência comparável.</li><li><strong>Áudio:</strong> apoio de acesso neutro, nunca penalidade ou rótulo matemático.</li></ul></section>
  </div>;
}
