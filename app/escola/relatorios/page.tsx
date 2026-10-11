import { AppShell } from "@/src/components/layout/app-shell";
import { AnalyticsDashboard } from "@/src/features/analytics/analytics-dashboard";
import { analyticsFiltersFromSearch } from "@/src/features/analytics/filters";
import { schoolNavigation } from "@/src/features/academics/navigation";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { SchoolSwitcher } from "@/src/features/schools/school-forms";
import { getAuthorizedAnalytics } from "@/src/server/analytics/service";
import { requireArea } from "@/src/server/auth/guard";
import { listAvailableSchools } from "@/src/server/schools/service";

export default async function SchoolReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireArea("escola");
  const school = session.schoolContext!;
  const [schools, result] = await Promise.all([listAvailableSchools(session.user.id), getAuthorizedAnalytics({ actor: { ...session.user }, filters: analyticsFiltersFromSearch(await searchParams, school.schoolId) })]);
  return <AppShell areaLabel="Coordenação" currentUserLabel={session.user.name} navigation={schoolNavigation} accountAction={<LogoutForm />} contextAction={<SchoolSwitcher userId={session.user.id} schools={schools} currentSchoolId={school.schoolId} />} statusLabel={school.schoolName}><AnalyticsDashboard result={result} basePath="/escola/relatorios" /></AppShell>;
}
