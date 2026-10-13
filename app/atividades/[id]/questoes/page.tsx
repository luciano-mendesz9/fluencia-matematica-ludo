import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { ActivityQuestionTable } from "@/src/features/management/management-tables";
import { getTeacherActivity } from "@/src/server/activities/service";
import { AuthorizationError } from "@/src/server/auth/errors";
import { requireArea } from "@/src/server/auth/guard";

const navigation=[{href:"/professor",label:"Visão geral"},{href:"/professor/turmas",label:"Minhas turmas"},{href:"/atividades",label:"Atividades"},{href:"/professor/relatorios",label:"Resultados"},{href:"/questoes",label:"Banco de questões"}];

export default async function ActivityQuestionsPage({params}:{params:Promise<{id:string}>}) {
  const session=await requireArea("professor");const {id}=await params;let activity;
  try{activity=await getTeacherActivity({actor:{...session.user},activityId:id});}catch(error){if(error instanceof AuthorizationError&&["NOT_FOUND","FORBIDDEN"].includes(error.code))notFound();throw error;}
  return <AppShell areaLabel="Professor" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm/>} statusLabel="Questões da atividade"><div className="space-y-8"><header><Link href={`/atividades/${id}`} className="font-bold text-brand">← Voltar ao resumo</Link><p className="mt-5 text-sm font-bold uppercase tracking-[0.12em] text-brand">Questões da atividade</p><h1 className="mt-1 text-3xl font-bold">{activity.title}</h1><p className="mt-2 text-muted">{activity.classGroup.name} · seleção fixa de {activity.versions.length} versões.</p></header><nav aria-label="Seções da atividade" className="flex flex-wrap gap-2"><Link href={`/atividades/${id}`} className="rounded-control border border-border bg-surface px-4 py-3 font-bold text-brand">Resumo</Link><Link href={`/atividades/${id}/questoes`} aria-current="page" className="rounded-control bg-brand px-4 py-3 font-bold text-white">Questões</Link><Link href={`/atividades/${id}/resultados`} className="rounded-control border border-border bg-surface px-4 py-3 font-bold text-brand">Resultados</Link></nav><ActivityQuestionTable questions={activity.versions}/></div></AppShell>;
}
