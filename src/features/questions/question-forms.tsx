"use client";

import { useActionState, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { createQuestionAction, createSkillAction, createThemeAction, createVersionAction, updateQuestionStatusAction, type QuestionActionState } from "./actions";

const initial: QuestionActionState = { status: "idle" };
type Taxonomy = { id: string; name: string; skills: { id: string; name: string }[] }[];

function Result({ state }: { state: QuestionActionState }) {
  if (!state.message) return null;
  return <p role={state.status === "success" ? "status" : "alert"} className={`rounded-control border p-3 text-sm font-medium ${state.status === "success" ? "border-green-200 bg-green-50 text-green-950" : "border-red-200 bg-red-50 text-red-950"}`}>{state.message}</p>;
}

function VersionFields({ taxonomy, initialValue }: { taxonomy: Taxonomy; initialValue?: { grade: number; difficulty: number; themeId: string; skillId: string | null; statement: string } }) {
  const [themeId, setThemeId] = useState(initialValue?.themeId ?? taxonomy[0]?.id ?? "");
  const skills = taxonomy.find((theme) => theme.id === themeId)?.skills ?? [];
  return <>
    <label className="grid gap-2 font-semibold text-foreground">Série<select name="grade" defaultValue={String(initialValue?.grade ?? 1)} className="min-h-11 rounded-control border border-border bg-surface px-3 py-2" required>{[1,2,3,4,5].map((value) => <option key={value} value={value}>{value}º ano</option>)}</select></label>
    <label className="grid gap-2 font-semibold text-foreground">Dificuldade atribuída pelo autor<select name="difficulty" defaultValue={String(initialValue?.difficulty ?? 1)} className="min-h-11 rounded-control border border-border bg-surface px-3 py-2" required>{[1,2,3,4,5,6].map((value) => <option key={value} value={value}>{value}</option>)}</select><span className="text-sm font-normal text-muted">Escala contextual ao conteúdo e à série.</span></label>
    <label className="grid gap-2 font-semibold text-foreground">Tema<select name="themeId" value={themeId} onChange={(event) => setThemeId(event.target.value)} className="min-h-11 rounded-control border border-border bg-surface px-3 py-2" required><option value="" disabled>Selecione</option>{taxonomy.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}</select></label>
    <label className="grid gap-2 font-semibold text-foreground">Habilidade (opcional)<select key={themeId} name="skillId" defaultValue={initialValue?.themeId === themeId ? initialValue.skillId ?? "" : ""} className="min-h-11 rounded-control border border-border bg-surface px-3 py-2"><option value="">Sem habilidade específica</option>{skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}</select></label>
    <label className="grid gap-2 font-semibold text-foreground">Enunciado<textarea name="statement" defaultValue={initialValue?.statement} minLength={5} maxLength={2000} rows={6} className="rounded-control border border-border bg-surface px-3 py-2" required /></label>
  </>;
}

export function CreateQuestionForm({ taxonomy }: { taxonomy: Taxonomy }) {
  const [state, action, pending] = useActionState(createQuestionAction, initial);
  if (!taxonomy.length) return <p className="rounded-control border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">A SEMED precisa cadastrar ao menos um tema antes da primeira questão.</p>;
  return <form action={action} className="grid gap-4" aria-busy={pending || undefined}><VersionFields taxonomy={taxonomy} /><Result state={state} /><Button type="submit" busy={pending}>Cadastrar questão</Button></form>;
}

export function CreateVersionForm({ question, taxonomy }: { question: { id: string; revision: number; latest: { grade: number; difficulty: number; theme: { id: string }; skill: { id: string } | null; statement: string } }; taxonomy: Taxonomy }) {
  const [state, action, pending] = useActionState(createVersionAction, initial);
  return <form action={action} className="grid gap-4" aria-busy={pending || undefined}><input type="hidden" name="questionId" value={question.id}/><input type="hidden" name="revision" value={question.revision}/><VersionFields taxonomy={taxonomy} initialValue={{ ...question.latest, themeId: question.latest.theme.id, skillId: question.latest.skill?.id ?? null }} /><Result state={state} /><Button type="submit" busy={pending}>Criar nova versão</Button></form>;
}

export function TaxonomyForms({ taxonomy }: { taxonomy: Taxonomy }) {
  const [themeState, themeAction, themePending] = useActionState(createThemeAction, initial);
  const [skillState, skillAction, skillPending] = useActionState(createSkillAction, initial);
  return <div className="grid gap-6 md:grid-cols-2"><form action={themeAction} className="grid content-start gap-4" aria-busy={themePending || undefined}><h3 className="text-lg font-bold">Novo tema</h3><Field id="theme-name" label="Nome" name="name" maxLength={120} required/><Result state={themeState}/><Button type="submit" busy={themePending}>Cadastrar tema</Button></form><form action={skillAction} className="grid content-start gap-4" aria-busy={skillPending || undefined}><h3 className="text-lg font-bold">Nova habilidade</h3><label className="grid gap-2 font-semibold">Tema<select name="themeId" className="min-h-11 rounded-control border border-border bg-surface px-3" required><option value="">Selecione</option>{taxonomy.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}</select></label><Field id="skill-name" label="Nome" name="name" maxLength={160} required/><Result state={skillState}/><Button type="submit" busy={skillPending}>Cadastrar habilidade</Button></form></div>;
}

export function QuestionStatusForm({ question }: { question: { id: string; revision: number; status: "ACTIVE" | "ARCHIVED" } }) {
  const [state, action, pending] = useActionState(updateQuestionStatusAction, initial);
  const next = question.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
  return <form action={action} className="grid gap-3" aria-busy={pending || undefined}><input type="hidden" name="questionId" value={question.id}/><input type="hidden" name="revision" value={question.revision}/><input type="hidden" name="status" value={next}/><Result state={state}/><Button type="submit" busy={pending}>{next === "ARCHIVED" ? "Arquivar questão" : "Reativar questão"}</Button></form>;
}
