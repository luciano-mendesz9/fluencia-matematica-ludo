import { AppShell } from "@/src/components/layout/app-shell";
import { StructurePanel } from "@/src/components/layout/structure-panel";

const navigation = [{ href: "/admin", label: "Visão geral" }];

export default function AdminPage() {
  return (
    <AppShell areaLabel="Administração" currentUserLabel="Acesso ainda não conectado" navigation={navigation}>
      <StructurePanel title="Área administrativa" description="Base visual para a futura gestão municipal, com navegação consistente e espaço reservado para fluxos autorizados." />
    </AppShell>
  );
}
