"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Tone = "neutral" | "success" | "warning" | "danger";

const toneClass: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-50 text-amber-900",
  danger: "bg-rose-50 text-rose-800",
};

export function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${toneClass[tone]}`}>{children}</span>;
}

export function ProgressBar({ value, label }: { value: number | null; label: string }) {
  const safe = Math.max(0, Math.min(100, value ?? 0));
  return <div className="min-w-32" aria-label={`${label}: ${value === null ? "sem dados" : `${value}%`}`}>
    <div className="flex items-center justify-between gap-3 text-xs"><span>{value === null ? "—" : `${value}%`}</span><span className="sr-only">{label}</span></div>
    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true"><span className="block h-full rounded-full bg-brand" style={{ width: `${safe}%` }} /></div>
  </div>;
}

type StudentRow = {
  id: string;
  name: string;
  answers: number;
  respondedActivities: number;
  pendingActivities: number;
  targetsReached: number;
  precisionPercent: number | null;
  performance: { label: string; tone: Tone };
};

export function TeacherStudentTable({ students, detailBasePath }: { students: StudentRow[]; detailBasePath: string }) {
  const [query, setQuery] = useState("");
  const [attention, setAttention] = useState("all");
  const [sort, setSort] = useState("name");
  const rows = useMemo(() => {
    const normalized = query.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR");
    return students.filter((student) => {
      const name = student.name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR");
      return name.includes(normalized) && (attention === "all" || (attention === "pending" ? student.pendingActivities > 0 : student.performance.tone === "danger"));
    }).sort((a, b) => sort === "precision" ? (b.precisionPercent ?? -1) - (a.precisionPercent ?? -1) : sort === "answers" ? b.answers - a.answers : a.name.localeCompare(b.name, "pt-BR"));
  }, [students, query, attention, sort]);
  return <section aria-labelledby="students-table-title">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h2 id="students-table-title" className="text-xl font-bold">Alunos e acompanhamento</h2><p className="mt-1 text-sm text-muted">Participação e desempenho são dimensões distintas; abra o aluno para ver as evidências.</p></div>
      <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto">
        <label className="text-sm font-semibold">Buscar<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome do aluno" className="adult-field mt-1" /></label>
        <label className="text-sm font-semibold">Situação<select value={attention} onChange={(event) => setAttention(event.target.value)} className="adult-field mt-1"><option value="all">Todos</option><option value="pending">Com pendências</option><option value="risk">Precisa acompanhamento</option></select></label>
        <label className="text-sm font-semibold">Ordenar<select value={sort} onChange={(event) => setSort(event.target.value)} className="adult-field mt-1"><option value="name">Nome</option><option value="answers">Mais respostas</option><option value="precision">Maior precisão</option></select></label>
      </div>
    </div>
    <div className="mt-4 overflow-x-auto rounded-panel border border-border bg-surface">
      <table className="min-w-full text-left text-sm"><thead className="bg-blue-50"><tr><th className="px-4 py-3">Aluno</th><th className="px-4 py-3">Participação</th><th className="px-4 py-3">Respostas</th><th className="px-4 py-3">Desempenho</th><th className="px-4 py-3"><span className="sr-only">Ação</span></th></tr></thead>
        <tbody>{rows.map((student) => <tr key={student.id} className="border-t border-border align-middle"><th className="px-4 py-3 font-semibold">{student.name}</th><td className="px-4 py-3">{student.respondedActivities} respondida(s)<span className="block text-xs text-muted">{student.pendingActivities} pendência(s) · {student.targetsReached} meta(s)</span></td><td className="px-4 py-3">{student.answers}</td><td className="px-4 py-3"><StatusPill tone={student.performance.tone}>{student.performance.label}</StatusPill><span className="mt-1 block text-xs text-muted">{student.precisionPercent === null ? "Sem respostas" : `${student.precisionPercent}% de precisão`}</span></td><td className="px-4 py-3 text-right"><Link href={`${detailBasePath}/alunos/${student.id}`} className="inline-flex min-h-11 items-center font-bold text-brand hover:underline">Ver detalhes →</Link></td></tr>)}{rows.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">Nenhum aluno corresponde aos filtros.</td></tr> : null}</tbody>
      </table>
    </div>
  </section>;
}

type ActivityRow = {
  id: string;
  title: string;
  status: "DRAFT" | "OPEN" | "CLOSED";
  classGroup: { name: string };
  recipients?: number;
  participants?: number;
  participationPercent?: number | null;
  precisionPercent?: number | null;
  updatedAt: Date | string;
};

const activityStatus = { DRAFT: "Rascunho", OPEN: "Aberta", CLOSED: "Encerrada" } as const;

export function ActivityManagementTable({ activities, showClass = true, initialStatus = "all" }: { activities: ActivityRow[]; showClass?: boolean; initialStatus?: string }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const rows = useMemo(() => activities.filter((activity) => activity.title.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")) && (status === "all" || activity.status === status)), [activities, query, status]);
  return <section aria-labelledby="activities-table-title">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 id="activities-table-title" className="text-xl font-bold">Atividades</h2><p className="mt-1 text-sm text-muted">Acesse configurações, questões e resultados no contexto de cada atividade.</p></div><div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto"><label className="text-sm font-semibold">Buscar<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Título" className="adult-field mt-1" /></label><label className="text-sm font-semibold">Estado<select value={status} onChange={(event) => setStatus(event.target.value)} className="adult-field mt-1"><option value="all">Todos</option><option value="DRAFT">Rascunhos</option><option value="OPEN">Abertas</option><option value="CLOSED">Encerradas</option></select></label></div></div>
    <div className="mt-4 overflow-x-auto rounded-panel border border-border bg-surface"><table className="min-w-full text-left text-sm"><thead className="bg-blue-50"><tr><th className="px-4 py-3">Atividade</th>{showClass ? <th className="px-4 py-3">Turma</th> : null}<th className="px-4 py-3">Estado</th><th className="px-4 py-3">Participação</th><th className="px-4 py-3"><span className="sr-only">Ação</span></th></tr></thead><tbody>{rows.map((activity) => <tr key={activity.id} className="border-t border-border"><th className="px-4 py-3 font-semibold">{activity.title}<span className="block text-xs font-normal text-muted">Atualizada em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Fortaleza" }).format(new Date(activity.updatedAt))}</span></th>{showClass ? <td className="px-4 py-3">{activity.classGroup.name}</td> : null}<td className="px-4 py-3"><StatusPill tone={activity.status === "OPEN" ? "success" : activity.status === "DRAFT" ? "warning" : "neutral"}>{activityStatus[activity.status]}</StatusPill></td><td className="px-4 py-3">{activity.recipients === undefined ? "Disponível após abertura" : `${activity.participants ?? 0} de ${activity.recipients}`}<span className="block text-xs text-muted">{activity.participationPercent === null || activity.participationPercent === undefined ? "Sem percentual" : `${activity.participationPercent}%`}</span></td><td className="px-4 py-3 text-right"><Link href={`/atividades/${activity.id}`} className="inline-flex min-h-11 items-center font-bold text-brand hover:underline">Abrir →</Link></td></tr>)}{rows.length === 0 ? <tr><td colSpan={showClass ? 5 : 4} className="px-4 py-10 text-center text-muted">Nenhuma atividade corresponde aos filtros.</td></tr> : null}</tbody></table></div>
  </section>;
}

export function DistributionBars({ rows }: { rows: Array<{ label: string; value: number; total: number }> }) {
  const max = Math.max(1, ...rows.map((item) => item.value));
  return <div className="space-y-3" role="img" aria-label="Distribuição por categoria">{rows.map((row) => <div key={row.label} className="grid grid-cols-[7rem_minmax(0,1fr)_3rem] items-center gap-3 text-sm"><span className="truncate font-semibold">{row.label}</span><span className="h-3 overflow-hidden rounded-full bg-slate-100" aria-hidden="true"><span className="block h-full rounded-full bg-brand" style={{ width: `${(row.value / max) * 100}%` }} /></span><span className="text-right font-bold">{row.value}</span><span className="sr-only">{row.label}: {row.value} de {row.total}</span></div>)}</div>;
}

type ActivityQuestion = { id: string; difficulty: number; statement: string; versionNumber: number; theme: { name: string }; skill: { name: string } | null; question: { origin: "SEMED" | "PRIVATE" } };

export function ActivityQuestionTable({ questions }: { questions: ActivityQuestion[] }) {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const rows = useMemo(() => questions.filter((question) => {
    const haystack = `${question.statement} ${question.theme.name} ${question.skill?.name ?? ""}`.toLocaleLowerCase("pt-BR");
    return haystack.includes(query.toLocaleLowerCase("pt-BR")) && (difficulty === "all" || question.difficulty === Number(difficulty));
  }), [questions, query, difficulty]);
  return <section aria-labelledby="activity-questions-title"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 id="activity-questions-title" className="text-xl font-bold">Questões fixadas</h2><p className="mt-1 text-sm text-muted">A versão vinculada permanece no histórico mesmo que o banco seja atualizado depois.</p></div><div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto"><label className="text-sm font-semibold">Buscar<input value={query} onChange={(event) => setQuery(event.target.value)} className="adult-field mt-1" placeholder="Tema, habilidade ou enunciado" /></label><label className="text-sm font-semibold">Dificuldade<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="adult-field mt-1"><option value="all">Todas</option>{[1,2,3,4,5,6].map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div></div><div className="mt-4 overflow-x-auto rounded-panel border border-border bg-surface"><table className="min-w-full text-left text-sm"><thead className="bg-blue-50"><tr><th className="px-4 py-3">Questão</th><th className="px-4 py-3">Tema / habilidade</th><th className="px-4 py-3">Dificuldade</th><th className="px-4 py-3">Origem</th><th className="px-4 py-3">Versão</th></tr></thead><tbody>{rows.map((question) => <tr key={question.id} className="border-t border-border align-top"><td className="max-w-xl px-4 py-3 font-medium">{question.statement}</td><td className="px-4 py-3">{question.theme.name}{question.skill ? <span className="block text-xs text-muted">{question.skill.name}</span> : null}</td><td className="px-4 py-3">{question.difficulty}</td><td className="px-4 py-3">{question.question.origin === "SEMED" ? "Rede" : "Própria"}</td><td className="px-4 py-3">{question.versionNumber}</td></tr>)}{rows.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">Nenhuma questão corresponde aos filtros.</td></tr> : null}</tbody></table></div></section>;
}
