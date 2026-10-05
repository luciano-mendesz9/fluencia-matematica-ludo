import { AppShell } from "@/src/components/layout/app-shell";
import { StructurePanel } from "@/src/components/layout/structure-panel";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { requireArea } from "@/src/server/auth/guard";

const navigation = [{ href: "/operacao", label: "Visão técnica" }];

export default async function OperationsPage() {
  const session = await requireArea("operacao");
  return (
    <AppShell areaLabel="Operação" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel="Sessão ativa">
      <StructurePanel title="Área de operação" description="Base protegida para saúde técnica e logs sanitizados, sem acesso automático a dados pedagógicos individuais." />
    </AppShell>
  );
}
