import { AppShell } from "@/src/components/layout/app-shell";
import { StructurePanel } from "@/src/components/layout/structure-panel";

const navigation = [{ href: "/professor", label: "Visão geral" }];

export default function ProfessorPage() {
  return (
    <AppShell areaLabel="Professor" currentUserLabel="Acesso ainda não conectado" navigation={navigation}>
      <StructurePanel title="Área do professor" description="Base visual para atividades, turmas e acompanhamento pedagógico, ainda sem expor ou simular registros de estudantes." />
    </AppShell>
  );
}
