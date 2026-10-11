import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { OperationsDashboard } from "@/src/features/operations/operations-dashboard";
import { technicalFiltersFromSearch } from "@/src/features/operations/filters";
import { requireArea } from "@/src/server/auth/guard";
import { getTechnicalOperations } from "@/src/server/operations/service";

const navigation = [{ href: "/admin", label: "Visão geral" }, { href: "/admin/escolas", label: "Escolas" }, { href: "/admin/pessoas", label: "Pessoas globais" }, { href: "/admin/relatorios", label: "Resultados" }, { href: "/admin/operacao", label: "Operação técnica" }, { href: "/questoes", label: "Banco de questões" }];

export default async function AdminOperationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireArea("admin");
  const result = await getTechnicalOperations({ actor: { ...session.user }, filters: technicalFiltersFromSearch(await searchParams) });
  return <AppShell areaLabel="Administração" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel="Rede municipal"><OperationsDashboard result={result} basePath="/admin/operacao" /></AppShell>;
}
