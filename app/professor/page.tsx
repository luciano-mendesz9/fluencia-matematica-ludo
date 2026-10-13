import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { ActivityManagementTable, DistributionBars } from "@/src/features/management/management-tables";
import { SchoolSwitcher } from "@/src/features/schools/school-forms";
import { requireArea } from "@/src/server/auth/guard";
import { getTeacherManagementOverview } from "@/src/server/management/service";
import { listAvailableSchools } from "@/src/server/schools/service";

const navigation = [
  { href: "/professor", label: "Visão geral" },
  { href: "/professor/turmas", label: "Minhas turmas" },
  { href: "/atividades", label: "Atividades" },
  { href: "/professor/relatorios", label: "Resultados" },
  { href: "/questoes", label: "Banco de questões" },
];

function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return <div className="adult-card p-5"><dt className="text-sm font-semibold text-muted">{label}</dt><dd className="mt-2 text-3xl font-extrabold tracking-tight">{value}</dd><p className="mt-1 text-sm text-muted">{detail}</p></div>;
}

export default async function ProfessorPage() {
  const session = await requireArea("professor");
  const school = session.schoolContext;
  if (!school) redirect("/selecionar-escola");
  const actor = { ...session.user };
  const [schools, overview] = await Promise.all([
    listAvailableSchools(session.user.id),
    getTeacherManagementOverview({ actor, schoolId: school.schoolId }),
  ]);
  return <AppShell areaLabel="Professor" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} contextAction={<SchoolSwitcher userId={session.user.id} schools={schools} currentSchoolId={school.schoolId} />} statusLabel={school.schoolName}>
    <div className="space-y-9">
      <header className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-sm font-bold uppercase tracking-[0.12em] text-brand">Acompanhamento pedagógico</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Olá, {session.user.name}.</h1><p className="mt-3 max-w-3xl leading-7 text-muted">Veja participação, pendências e desempenho das suas turmas em {school.schoolName}. Pontos e ranking permanecem separados dos indicadores pedagógicos.</p></div><Link href="/atividades/nova" className="inline-flex min-h-11 items-center rounded-control bg-brand px-5 font-bold text-white hover:bg-brand-hover">＋ Criar atividade</Link></header>

      <section aria-labelledby="teacher-summary-title"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 id="teacher-summary-title" className="text-xl font-bold">O que precisa de atenção</h2><p className="mt-1 text-sm text-muted">Resumo dos dados persistidos para suas atribuições vigentes.</p></div><Link href="/professor/relatorios" className="font-bold text-brand hover:underline">Analisar resultados →</Link></div><dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Turmas" value={overview.summary.classes} detail={`${overview.summary.students} matrículas ativas`} /><Metric label="Atividades abertas" value={overview.summary.openActivities} detail="Disponíveis para responder" /><Metric label="Rascunhos" value={overview.summary.drafts} detail="Aguardando revisão ou abertura" /><Metric label="Alunos com pendências" value={overview.summary.studentsNeedingAttention} detail="Sem iniciar ou abaixo da meta em atividade aberta" /><Metric label="Atividades no histórico" value={overview.activities.length} detail="Rascunhos, abertas e encerradas" /></dl></section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,.75fr)]" aria-labelledby="classes-overview-title"><div><div className="mb-4"><h2 id="classes-overview-title" className="text-xl font-bold">Alunos por turma</h2><p className="mt-1 text-sm text-muted">Matrículas ativas em cada atribuição vigente.</p></div><div className="adult-card p-5"><DistributionBars rows={overview.assignments.map((assignment) => ({ label: assignment.classGroup.name, value: assignment.classGroup.enrollments.length, total: overview.summary.students }))} />{overview.assignments.length === 0 ? <p className="text-muted">Nenhuma turma atribuída nesta escola.</p> : null}</div></div><aside className="adult-card p-5"><h2 className="text-xl font-bold">Próximas ações</h2><ul className="mt-4 grid gap-3 text-sm"><li><Link href="/professor/turmas" className="block rounded-control bg-blue-50 p-4 font-bold text-brand">Acompanhar alunos por turma →</Link></li><li><Link href="/atividades?status=OPEN" className="block rounded-control bg-blue-50 p-4 font-bold text-brand">Revisar atividades abertas →</Link></li><li><Link href="/questoes?origin=PRIVATE" className="block rounded-control bg-blue-50 p-4 font-bold text-brand">Minhas questões →</Link></li></ul></aside></section>

      <ActivityManagementTable activities={overview.activities.slice(0, 6)} />
    </div>
  </AppShell>;
}
