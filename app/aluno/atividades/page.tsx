import { AppShell } from "@/src/components/layout/app-shell";
import { Icon } from "@/src/components/ui/icon";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { StudentActivityCard, type StudentActivitySummary } from "@/src/features/students/student-activity-card";
import { STUDENT_NAVIGATION } from "@/src/features/students/navigation";
import { requireArea } from "@/src/server/auth/guard";
import { listStudentActivities } from "@/src/server/activities/service";

export default async function StudentActivitiesPage() {
  const session = await requireArea("aluno");
  const activities = await listStudentActivities({ ...session.user }) as StudentActivitySummary[];
  const openCount = activities.filter((item) => item.activity.status === "OPEN").length;
  const classLabel = activities[0] ? `${activities[0].activity.classGroup.name} · ${activities[0].activity.classGroup.grade}º ano` : "Área do aluno";
  return <AppShell areaLabel="Aluno" currentUserLabel={session.user.name} navigation={[...STUDENT_NAVIGATION]} accountAction={<LogoutForm />} statusLabel={classLabel}>
    <div><p className="font-extrabold uppercase text-brand">Suas missões</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">Atividades da sua turma</h1><p className="mt-2 text-muted">{classLabel} · {openCount ? `${openCount} atividade(s) aberta(s)` : "nenhuma atividade aberta"}</p></div>
    {activities.length ? <div className="mt-6 grid gap-4 md:grid-cols-2">{activities.map((item) => <StudentActivityCard key={item.id} item={item} />)}</div> : <section className="student-card mt-6 p-6 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-brand"><Icon name="clipboard" className="size-7" /></span><h2 className="mt-4 text-xl font-black">Nenhuma atividade disponível</h2><p className="mt-2 text-muted">Sua turma ainda não recebeu uma missão.</p></section>}
  </AppShell>;
}
