import { redirect } from "next/navigation";
import { AppShell } from "@/src/components/layout/app-shell";
import { StructurePanel } from "@/src/components/layout/structure-panel";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { SchoolSwitcher } from "@/src/features/schools/school-forms";
import { requireArea } from "@/src/server/auth/guard";
import { listAvailableSchools } from "@/src/server/schools/service";

const navigation = [
  { href: "/professor", label: "Visão geral" },
  { href: "/professor/turmas", label: "Minhas turmas" },
  { href: "/questoes", label: "Banco de questões" },
];

export default async function ProfessorPage() {
  const session = await requireArea("professor");
  const schoolContext = session.schoolContext;
  if (!schoolContext) redirect("/selecionar-escola");
  const schools = await listAvailableSchools(session.user.id);
  return (
    <AppShell areaLabel="Professor" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} contextAction={<SchoolSwitcher userId={session.user.id} schools={schools} currentSchoolId={schoolContext.schoolId} />} statusLabel={schoolContext.schoolName}>
      <StructurePanel title={`Área do professor — ${schoolContext.schoolName}`} description="O contexto escolar foi validado no servidor. Atividades, turmas e acompanhamento serão adicionados nas tarefas próprias sem misturar escolas." />
    </AppShell>
  );
}
