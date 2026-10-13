import Link from "next/link";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { ActivityManagementTable } from "@/src/features/management/management-tables";
import { SchoolSwitcher } from "@/src/features/schools/school-forms";
import { requireArea } from "@/src/server/auth/guard";
import { listTeacherActivities } from "@/src/server/activities/service";
import { percentage } from "@/src/server/management/service";
import { listAvailableSchools } from "@/src/server/schools/service";

const navigation=[{href:"/professor",label:"Visão geral"},{href:"/professor/turmas",label:"Minhas turmas"},{href:"/atividades",label:"Atividades"},{href:"/professor/relatorios",label:"Resultados"},{href:"/questoes",label:"Banco de questões"}];

export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session=await requireArea("professor");
  const school=session.schoolContext!;
  const actor={...session.user};
  const [activities,schools,params]=await Promise.all([listTeacherActivities({actor,schoolId:school.schoolId}),listAvailableSchools(session.user.id),searchParams]);
  const initialStatus = typeof params.status === "string" && ["DRAFT", "OPEN", "CLOSED"].includes(params.status) ? params.status : "all";
  const rows=activities.map((activity)=>{const answers=activity.participations.reduce((sum,item)=>sum+item.acceptedAnswers,0);const correct=activity.participations.reduce((sum,item)=>sum+item.correctAnswers,0);const participants=activity.participations.filter((item)=>item.acceptedAnswers>0).length;return {...activity,recipients:activity.participations.length,participants,participationPercent:percentage(participants,activity.participations.length),precisionPercent:percentage(correct,answers)};});
  return <AppShell areaLabel="Professor" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm/>} contextAction={<SchoolSwitcher userId={session.user.id} schools={schools} currentSchoolId={school.schoolId}/>} statusLabel={school.schoolName}><div className="space-y-8"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[0.12em] text-brand">Organização pedagógica</p><h1 className="mt-2 text-3xl font-bold">Atividades</h1><p className="mt-2 max-w-3xl text-muted">Busque e filtre atividades. Configurações, questões e resultados ficam em contextos separados.</p></div><Link href="/atividades/nova" className="inline-flex min-h-11 items-center rounded-control bg-brand px-5 font-bold text-white hover:bg-brand-hover">＋ Nova atividade</Link></header><ActivityManagementTable activities={rows} initialStatus={initialStatus}/></div></AppShell>;
}
