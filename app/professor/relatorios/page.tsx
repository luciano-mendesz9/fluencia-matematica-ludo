import { AppShell } from "@/src/components/layout/app-shell";
import { AnalyticsDashboard } from "@/src/features/analytics/analytics-dashboard";
import { analyticsFiltersFromSearch } from "@/src/features/analytics/filters";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { SchoolSwitcher } from "@/src/features/schools/school-forms";
import { getAuthorizedAnalytics } from "@/src/server/analytics/service";
import { requireArea } from "@/src/server/auth/guard";
import { listAvailableSchools } from "@/src/server/schools/service";

const navigation = [{ href: "/professor", label: "Visão geral" }, { href: "/professor/turmas", label: "Minhas turmas" }, { href: "/professor/relatorios", label: "Resultados" }, { href: "/questoes", label: "Banco de questões" }, { href: "/atividades", label: "Atividades" }];

export default async function TeacherReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireArea("professor");
  const school = session.schoolContext!;
  const [schools, result] = await Promise.all([
    listAvailableSchools(session.user.id),
    getAuthorizedAnalytics({ actor: { ...session.user }, filters: analyticsFiltersFromSearch(await searchParams, school.schoolId) }),
  ]);
  return <AppShell areaLabel="Professor" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} contextAction={<SchoolSwitcher userId={session.user.id} schools={schools} currentSchoolId={school.schoolId} />} statusLabel={school.schoolName}><AnalyticsDashboard result={result} basePath="/professor/relatorios" /></AppShell>;
}
