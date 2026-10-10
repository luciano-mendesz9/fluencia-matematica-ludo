import Link from "next/link";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { ActivityEditor } from "@/src/features/activities/activity-forms";
import { requireArea } from "@/src/server/auth/guard";
import { listActivityAuthoringOptions } from "@/src/server/activities/service";

const navigation=[{href:"/professor",label:"Visão geral"},{href:"/professor/turmas",label:"Minhas turmas"},{href:"/questoes",label:"Banco de questões"},{href:"/atividades",label:"Atividades"}];
export default async function NewActivityPage(){const session=await requireArea("professor");const school=session.schoolContext!;const options=await listActivityAuthoringOptions({actor:{...session.user},schoolId:school.schoolId});return <AppShell areaLabel="Professor" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm/>} statusLabel={school.schoolName}><div className="grid gap-6"><header><Link href="/atividades" className="font-bold text-brand">← Voltar às atividades</Link><h1 className="mt-3 text-3xl font-bold">Nova atividade</h1><p className="mt-2 text-muted">A série é derivada da turma. A seleção combina questões da rede com suas questões privadas.</p></header>{options.classes.length===0?<p className="rounded-panel border border-border bg-surface p-5 text-muted">Você não possui turma vigente nesta escola.</p>:<section className="rounded-panel border border-border bg-surface p-5 sm:p-6"><ActivityEditor schoolId={school.schoolId} classes={options.classes} versions={options.versions}/></section>}</div></AppShell>}
