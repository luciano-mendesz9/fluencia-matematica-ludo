import { redirect } from "next/navigation";
import { AppShell } from "@/src/components/layout/app-shell";
import { AreaDashboard } from "@/src/components/layout/area-dashboard";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { SchoolSwitcher } from "@/src/features/schools/school-forms";
import { requireArea } from "@/src/server/auth/guard";
import { listAvailableSchools } from "@/src/server/schools/service";
import { listAssignedClasses } from "@/src/server/people/service";
import { listTeacherActivities } from "@/src/server/activities/service";

const navigation = [
  { href: "/professor", label: "Visão geral" },
  { href: "/professor/turmas", label: "Minhas turmas" },
  { href: "/questoes", label: "Banco de questões" },
  { href: "/atividades", label: "Atividades" },
];

export default async function ProfessorPage() {
  const session = await requireArea("professor");
  const schoolContext = session.schoolContext;
  if (!schoolContext) redirect("/selecionar-escola");
  const actor = { ...session.user };
  const [schools, assignments, activities] = await Promise.all([listAvailableSchools(session.user.id), listAssignedClasses({ actor, schoolId: schoolContext.schoolId }), listTeacherActivities({ actor, schoolId: schoolContext.schoolId })]);
  return (
    <AppShell areaLabel="Professor" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} contextAction={<SchoolSwitcher userId={session.user.id} schools={schools} currentSchoolId={schoolContext.schoolId} />} statusLabel={schoolContext.schoolName}>
      <AreaDashboard eyebrow="Visão geral do professor" title={`Olá, ${session.user.name}.`} description={`Organize suas turmas, questões e atividades em ${schoolContext.schoolName}.`} primaryAction={{ href: "/atividades/nova", label: "Criar atividade" }} metrics={[{ label: "Turmas", value: assignments.length, description: "Atribuições vigentes", icon: "school" }, { label: "Atividades abertas", value: activities.filter((activity) => activity.status === "OPEN").length, description: "Disponíveis aos alunos", icon: "activity" }, { label: "Rascunhos", value: activities.filter((activity) => activity.status === "DRAFT").length, description: "Aguardando edição ou abertura", icon: "clipboard" }]} destinations={[{ href: "/professor/turmas", title: "Minhas turmas", description: "Consulte somente as turmas atribuídas a você nesta escola.", icon: "school" }, { href: "/atividades", title: "Atividades", description: "Crie, revise, abra e acompanhe atividades.", icon: "clipboard" }, { href: "/questoes", title: "Banco de questões", description: "Use questões da rede e gerencie suas questões privadas.", icon: "book" }]} />
    </AppShell>
  );
}
