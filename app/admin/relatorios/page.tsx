import { AppShell } from "@/src/components/layout/app-shell";
import { AnalyticsDashboard } from "@/src/features/analytics/analytics-dashboard";
import { analyticsFiltersFromSearch } from "@/src/features/analytics/filters";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { getAuthorizedAnalytics } from "@/src/server/analytics/service";
import { requireArea } from "@/src/server/auth/guard";

const navigation = [{ href: "/admin", label: "Visão geral" }, { href: "/admin/escolas", label: "Escolas" }, { href: "/admin/pessoas", label: "Pessoas globais" }, { href: "/admin/relatorios", label: "Resultados" }, { href: "/questoes", label: "Banco de questões" }];

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireArea("admin");
  const result = await getAuthorizedAnalytics({ actor: { ...session.user }, filters: analyticsFiltersFromSearch(await searchParams) });
  return <AppShell areaLabel="Administração" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel="Rede municipal"><AnalyticsDashboard result={result} basePath="/admin/relatorios" showStudentNames={false} /></AppShell>;
}
