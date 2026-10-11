import { redirect } from "next/navigation";
import { AppShell } from "@/src/components/layout/app-shell";
import { AreaDashboard } from "@/src/components/layout/area-dashboard";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { SchoolSwitcher } from "@/src/features/schools/school-forms";
import { schoolNavigation } from "@/src/features/academics/navigation";
import { requireArea } from "@/src/server/auth/guard";
import { listAvailableSchools } from "@/src/server/schools/service";
import { listAcademicYears, listClassGroups } from "@/src/server/academics/service";
import { listStudents } from "@/src/server/students/service";

export default async function SchoolPage() {
  const session = await requireArea("escola");
  const schoolContext = session.schoolContext;
  if (!schoolContext) redirect("/selecionar-escola");
  const actor = { ...session.user };
  const [schools, years, classes, students] = await Promise.all([listAvailableSchools(session.user.id), listAcademicYears({ actor, schoolId: schoolContext.schoolId }), listClassGroups({ actor, schoolId: schoolContext.schoolId }), listStudents({ actor, schoolId: schoolContext.schoolId })]);
  return (
    <AppShell areaLabel="Coordenação" currentUserLabel={session.user.name} navigation={schoolNavigation} accountAction={<LogoutForm />} contextAction={<SchoolSwitcher userId={session.user.id} schools={schools} currentSchoolId={schoolContext.schoolId} />} statusLabel={schoolContext.schoolName}>
      <AreaDashboard eyebrow="Visão geral da coordenação" title={schoolContext.schoolName} description="Gerencie a estrutura e as pessoas da escola selecionada com o contexto validado no servidor." metrics={[{ label: "Anos letivos ativos", value: years.filter((year) => year.status === "ACTIVE").length, description: "Períodos disponíveis", icon: "clipboard" }, { label: "Turmas ativas", value: classes.filter((group) => group.status === "ACTIVE").length, description: "Do 1º ao 5º ano", icon: "school" }, { label: "Alunos", value: students.length, description: "Contas vinculadas à escola", icon: "graduation-cap" }]} destinations={[{ href: "/escola/anos", title: "Anos letivos", description: "Cadastre e acompanhe os períodos escolares.", icon: "clipboard" }, { href: "/escola/turmas", title: "Turmas", description: "Organize as turmas e séries da escola.", icon: "school" }, { href: "/escola/relatorios", title: "Resultados pedagógicos", description: "Acompanhe participação, metas, cobertura e precisão da escola.", icon: "activity" }, { href: "/escola/alunos", title: "Alunos", description: "Cadastre alunos e gerencie matrículas individuais.", icon: "graduation-cap" }, { href: "/escola/pessoas", title: "Pessoas e atribuições", description: "Gerencie professores, coordenação e atribuições de turma.", icon: "people" }]} />
    </AppShell>
  );
}
