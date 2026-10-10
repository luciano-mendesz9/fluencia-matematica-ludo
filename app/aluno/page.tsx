import { AppShell } from "@/src/components/layout/app-shell";
import Link from "next/link";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { requireArea } from "@/src/server/auth/guard";
import { listStudentActivities } from "@/src/server/activities/service";

const navigation = [{ href: "/aluno", label: "Início" }];

export default async function StudentPage() {
  const session = await requireArea("aluno");
  const activities = await listStudentActivities({ ...session.user });
  return (
    <AppShell areaLabel="Aluno" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel="Sessão ativa">
      <h1 className="text-3xl font-bold">Área do aluno</h1><h2 className="mt-6 text-2xl font-bold">Minhas atividades</h2><p className="mt-2 text-muted">Acompanhe sua meta e continue praticando mesmo depois de cumpri-la.</p>
      {activities.length===0?<p className="mt-6 rounded-panel border border-border bg-surface p-5 text-muted">Nenhuma atividade disponível.</p>:<ul className="mt-6 grid gap-4">{activities.map((item)=>{const progress=Math.min(item.acceptedAnswers,item.activity.targetCount);return <li key={item.id} className="rounded-panel border border-border bg-surface p-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-xl font-bold">{item.activity.title}</h2><p className="mt-1 text-sm text-muted">{item.activity.classGroup.name} · {item.activity.status==="OPEN"?"Aberta":"Encerrada"}</p></div><span className="font-bold text-brand">{item.targetReachedAt?"Meta cumprida":item.acceptedAnswers?"Em andamento":"Não iniciada"}</span></div><p className="mt-4 font-semibold">{progress}/{item.activity.targetCount} respostas na meta · {item.extraAnswers} extras</p><Link href={`/aluno/atividades/${item.activity.id}`} className="mt-4 inline-flex min-h-11 items-center rounded-control bg-brand px-4 font-bold text-white">Ver progresso</Link></li>})}</ul>}
    </AppShell>
  );
}
