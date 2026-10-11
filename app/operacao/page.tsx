import { AppShell } from "@/src/components/layout/app-shell";
import { AreaDashboard } from "@/src/components/layout/area-dashboard";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { requireArea } from "@/src/server/auth/guard";

const navigation = [{ href: "/operacao", label: "Visão técnica" }];

export default async function OperationsPage() {
  const session = await requireArea("operacao");
  return (
    <AppShell areaLabel="Operação" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel="Sessão ativa">
      <AreaDashboard eyebrow="Visão técnica" title={`Olá, ${session.user.name}.`} description="Área protegida para capacidades operacionais. Dados pedagógicos individuais e ações críticas não são expostos a este perfil." destinations={[{ href: "/operacao", title: "Estado da área", description: "O painel técnico completo será conectado na tarefa operacional correspondente; nenhuma métrica simulada é exibida.", icon: "gauge", action: "Você está aqui" }]} />
    </AppShell>
  );
}
