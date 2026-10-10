"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { closeActivityAction, createActivityAction, openActivityAction, updateActivityAction, type ActivityActionState } from "./actions";

const initial: ActivityActionState = { status: "idle" };
type Classroom = { id: string; name: string; grade: number; academicYear: { year: number } };
type Version = { id: string; grade: number; difficulty: number; statement: string; theme: { name: string }; skill: { name: string } | null; question: { origin: "SEMED" | "PRIVATE" } };

export function ActivityEditor({ schoolId, classes, versions, activity }: { schoolId: string; classes: Classroom[]; versions: Version[]; activity?: { id: string; revision: number; classId: string; title: string; instructions: string | null; targetCount: number; versionIds: string[] } }) {
  const action = activity ? updateActivityAction : createActivityAction;
  const [state, formAction, pending] = useActionState(action, initial);
  const [classId, setClassId] = useState(activity?.classId ?? classes[0]?.id ?? "");
  const [selected, setSelected] = useState<string[]>(activity?.versionIds ?? []);
  const group = classes.find((item) => item.id === classId);
  const eligible = useMemo(() => versions.filter((version) => version.grade === group?.grade), [versions, group?.grade]);
  const gaps = [1,2,3,4,5,6].filter((difficulty) => !eligible.some((version) => version.difficulty === difficulty && selected.includes(version.id)));
  return <form action={formAction} className="grid gap-6">
    {activity ? (
      <><input type="hidden" name="activityId" value={activity.id}/><input type="hidden" name="revision" value={activity.revision}/></>
    ) : (
      <input type="hidden" name="schoolId" value={schoolId}/>
    )}
    <div className="grid gap-4 md:grid-cols-2"><label className="grid gap-1 font-semibold">Turma<select name="classId" value={classId} onChange={(event)=>{setClassId(event.target.value);setSelected([]);}} disabled={Boolean(activity)} className="min-h-11 rounded-control border border-border bg-surface px-3">{classes.map((item)=><option key={item.id} value={item.id}>{item.name} · {item.grade}º ano · {item.academicYear.year}</option>)}</select>{activity&&<input type="hidden" name="classId" value={activity.classId}/>}</label><label className="grid gap-1 font-semibold">Meta de respostas aceitas<input name="targetCount" type="number" min="1" max="1000" required defaultValue={activity?.targetCount ?? 20} className="min-h-11 rounded-control border border-border px-3"/></label></div>
    <label className="grid gap-1 font-semibold">Título<input name="title" required minLength={3} maxLength={160} defaultValue={activity?.title} className="min-h-11 rounded-control border border-border px-3"/></label>
    <label className="grid gap-1 font-semibold">Orientações <span className="text-sm font-normal text-muted">(opcional)</span><textarea name="instructions" maxLength={1000} defaultValue={activity?.instructions ?? ""} className="min-h-24 rounded-control border border-border p-3"/></label>
    <section aria-labelledby="coverage-heading"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="coverage-heading" className="text-xl font-bold">Cobertura das dificuldades</h2><p className="mt-1 text-sm text-muted">Escolha ao menos uma questão de cada dificuldade, de 1 a 6.</p></div><p role="status" className={`rounded-full px-3 py-2 text-sm font-bold ${gaps.length ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"}`}>{gaps.length ? `Faltam: ${gaps.join(", ")}` : "Cobertura completa"}</p></div>
      {eligible.length===0?<p className="mt-4 rounded-control border border-border p-4 text-muted">Não há questões completas elegíveis para esta série.</p>:<ul className="mt-4 grid gap-3">{eligible.map((version)=><li key={version.id}><label className="flex cursor-pointer gap-3 rounded-control border border-border bg-surface p-4 hover:border-brand"><input type="checkbox" name="questionVersionIds" value={version.id} checked={selected.includes(version.id)} onChange={(event)=>setSelected((current)=>event.target.checked?[...current,version.id]:current.filter((id)=>id!==version.id))} className="mt-1 size-5"/><span><span className="font-bold">Dificuldade {version.difficulty} · {version.theme.name}</span><span className="ml-2 text-xs font-bold uppercase text-brand">{version.question.origin==="SEMED"?"Rede":"Própria"}</span><span className="mt-1 block text-sm text-muted">{version.statement}</span></span></label></li>)}</ul>}
    </section>
    {state.message&&<p role={state.status==="error"?"alert":"status"} className={state.status==="error"?"text-danger":"text-success"}>{state.message}{state.activityId&&<> <Link className="font-bold underline" href={`/atividades/${state.activityId}`}>Abrir rascunho</Link></>}</p>}
    <button disabled={pending||!classId} className="min-h-11 justify-self-start rounded-control bg-brand px-5 font-bold text-white disabled:opacity-60">{pending?"Aguarde...":activity?"Salvar rascunho":"Criar rascunho"}</button>
  </form>;
}

export function LifecycleButton({ activityId, revision, mode, disabled }: { activityId: string; revision: number; mode: "open"|"close"; disabled?: boolean }) {
  const [state, action, pending]=useActionState(mode==="open"?openActivityAction:closeActivityAction,initial);
  return <form action={action} className="grid gap-2"><input type="hidden" name="activityId" value={activityId}/><input type="hidden" name="revision" value={revision}/><button disabled={pending||disabled} className={`min-h-11 rounded-control px-5 font-bold text-white disabled:opacity-60 ${mode==="open"?"bg-brand":"bg-danger"}`}>{pending?"Aguarde...":mode==="open"?"Abrir atividade":"Encerrar atividade"}</button>{state.message&&<p role={state.status==="error"?"alert":"status"} className="max-w-md text-sm">{state.message}</p>}</form>;
}
