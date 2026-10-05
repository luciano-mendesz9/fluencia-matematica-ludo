import { redirect } from "next/navigation";
import { AppShell } from "@/src/components/layout/app-shell";
import { StructurePanel } from "@/src/components/layout/structure-panel";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { SchoolSwitcher } from "@/src/features/schools/school-forms";
import { requireArea } from "@/src/server/auth/guard";
import { listAvailableSchools } from "@/src/server/schools/service";

const navigation = [{ href: "/escola", label: "Visão geral" }];

export default async function SchoolPage() {
  const session = await requireArea("escola");
  const schoolContext = session.schoolContext;
  if (!schoolContext) redirect("/selecionar-escola");
  const schools = await listAvailableSchools(session.user.id);
  return (
    <AppShell areaLabel="Coordenação" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} contextAction={<SchoolSwitcher userId={session.user.id} schools={schools} currentSchoolId={schoolContext.schoolId} />} statusLabel={schoolContext.schoolName}>
      <StructurePanel title={`Coordenação — ${schoolContext.schoolName}`} description="O vínculo de coordenação e a escola atual foram confirmados no servidor. Cadastros escolares serão conectados nas tarefas seguintes." />
    </AppShell>
  );
}
