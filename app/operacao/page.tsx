import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { OperationsDashboard } from "@/src/features/operations/operations-dashboard";
import { technicalFiltersFromSearch } from "@/src/features/operations/filters";
import { requireArea } from "@/src/server/auth/guard";
import { getTechnicalOperations } from "@/src/server/operations/service";

const navigation = [{ href: "/operacao", label: "Visão técnica" }];

export default async function OperationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireArea("operacao");
  const result = await getTechnicalOperations({ actor: { ...session.user }, filters: technicalFiltersFromSearch(await searchParams) });
  return (
    <AppShell areaLabel="Operação" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel="Sessão ativa">
      <OperationsDashboard result={result} basePath="/operacao" />
    </AppShell>
  );
}
