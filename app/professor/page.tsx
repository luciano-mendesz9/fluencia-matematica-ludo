import { AppShell } from "@/src/components/layout/app-shell";
import { StructurePanel } from "@/src/components/layout/structure-panel";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { requireArea } from "@/src/server/auth/guard";

const navigation = [{ href: "/professor", label: "Visão geral" }];

export default async function ProfessorPage() {
  const session = await requireArea("professor");
  return (
    <AppShell areaLabel="Professor" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel="Sessão ativa">
      <StructurePanel title="Área do professor" description="Base visual para atividades, turmas e acompanhamento pedagógico, ainda sem expor ou simular registros de estudantes." />
    </AppShell>
  );
}
