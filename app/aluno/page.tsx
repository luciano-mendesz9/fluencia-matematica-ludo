import Link from "next/link";
import { AppShell } from "@/src/components/layout/app-shell";
import { Icon } from "@/src/components/ui/icon";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { StudentActivityCard, type StudentActivitySummary } from "@/src/features/students/student-activity-card";
import { requireArea } from "@/src/server/auth/guard";
import { listStudentActivities } from "@/src/server/activities/service";

const navigation = [{ href: "/aluno", label: "Início" }, { href: "/aluno/atividades", label: "Atividades" }, { href: "/aluno/resultados", label: "Resultados" }, { href: "/aluno/ranking", label: "Ranking" }];

export default async function StudentPage() {
  const session = await requireArea("aluno");
  const activities = await listStudentActivities({ ...session.user }) as StudentActivitySummary[];
  const open = activities.filter((item) => item.activity.status === "OPEN");
  const mission = open[0] ?? activities[0];
  const other = activities.filter((item) => item.id !== mission?.id).slice(0, 3);
  const firstName = session.user.name.split(/\s+/)[0] ?? session.user.name;
  const context = mission ? `${mission.activity.classGroup.name} · ${mission.activity.classGroup.grade}º ano` : "Área do aluno";

  return <AppShell areaLabel="Aluno" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel={context}>
    <h1 className="sr-only">Área do aluno</h1>
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[1.5rem] bg-[#eaf3ff] p-5 sm:p-7"><div className="relative z-10 max-w-[75%]"><p className="text-sm font-extrabold uppercase text-brand">{context}</p><h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Olá, {firstName}! <span aria-hidden="true">👋</span></h2><p className="mt-2 text-base text-muted">Pronto para mais uma aventura matemática?</p></div><div aria-hidden="true" className="absolute -bottom-5 -right-4 grid size-36 place-items-center rounded-full bg-[#d7e8ff] text-6xl sm:right-8">✦</div></section>

      {mission ? <section aria-labelledby="mission-title"><div className="mb-3 flex items-center justify-between gap-3"><h2 id="mission-title" className="text-xl font-black">Sua missão</h2><Link href="/aluno/atividades" className="inline-flex min-h-11 items-center font-extrabold text-brand">Ver todas</Link></div><StudentActivityCard item={mission} prominent /></section> : <section className="student-card p-6 text-center" aria-labelledby="empty-title"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-brand"><Icon name="sparkles" className="size-7" /></span><h2 id="empty-title" className="mt-4 text-xl font-black">Nenhuma missão disponível</h2><p className="mt-2 text-muted">Quando sua turma receber uma atividade, ela aparecerá aqui.</p></section>}

      {mission ? <section aria-labelledby="journey-title"><h2 id="journey-title" className="mb-3 text-xl font-black">Seu caminho nesta missão</h2><div className="student-card p-5"><ol className="grid grid-cols-4 gap-1 text-center text-xs font-extrabold sm:text-sm">{["Começou", "Praticando", "Quase lá", "Meta"].map((label, index) => { const progress = Math.min(mission.acceptedAnswers, mission.activity.targetCount); const reached = progress >= Math.ceil((mission.activity.targetCount * index) / 3); return <li key={label}><span className={`mx-auto grid size-9 place-items-center rounded-full ${reached ? "bg-brand text-white" : "bg-slate-100 text-muted"}`}>{reached ? "✓" : index + 1}</span><span className="mt-2 block">{label}</span></li>; })}</ol><dl className="mt-5 grid grid-cols-3 gap-3 border-t border-[#e2e9f3] pt-4 text-center text-sm"><div><dt className="text-muted">Certas</dt><dd className="text-xl font-black">{mission.correctAnswers}</dd></div><div><dt className="text-muted">Para revisar</dt><dd className="text-xl font-black">{mission.incorrectAnswers}</dd></div><div><dt className="text-muted">Adicionais</dt><dd className="text-xl font-black">{mission.extraAnswers}</dd></div></dl></div></section> : null}

      {other.length ? <section aria-labelledby="other-title"><div className="mb-3 flex items-center justify-between gap-3"><h2 id="other-title" className="text-xl font-black">Outras missões</h2><Link href="/aluno/atividades" className="inline-flex min-h-11 items-center font-extrabold text-brand">Ver todas</Link></div><div className="grid gap-4 md:grid-cols-2">{other.map((item) => <StudentActivityCard key={item.id} item={item} />)}</div></section> : null}
    </div>
  </AppShell>;
}
