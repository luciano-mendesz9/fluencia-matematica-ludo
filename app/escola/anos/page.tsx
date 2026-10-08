import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { CreateAcademicYearForm } from "@/src/features/academics/academic-forms";
import { AcademicYearList } from "@/src/features/academics/academic-lists";
import { schoolNavigation } from "@/src/features/academics/navigation";
import { SchoolSwitcher } from "@/src/features/schools/school-forms";
import { requireArea } from "@/src/server/auth/guard";
import { listAcademicYears } from "@/src/server/academics/service";
import { listAvailableSchools } from "@/src/server/schools/service";

export default async function AcademicYearsPage() {
  const session = await requireArea("escola");
  const school = session.schoolContext!;
  const actor = { ...session.user };
  const [years, schools] = await Promise.all([
    listAcademicYears({ actor, schoolId: school.schoolId }),
    listAvailableSchools(session.user.id),
  ]);
  return (
    <AppShell areaLabel="Coordenação" currentUserLabel={session.user.name} navigation={schoolNavigation} accountAction={<LogoutForm />} contextAction={<SchoolSwitcher userId={session.user.id} schools={schools} currentSchoolId={school.schoolId} />} statusLabel={school.schoolName}>
      <div className="grid gap-8 xl:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
        <section className="rounded-panel border border-border bg-surface p-5 sm:p-6" aria-labelledby="new-year-title">
          <h1 id="new-year-title" className="text-2xl font-bold text-foreground">Cadastrar ano letivo</h1>
          <p className="mb-6 mt-2 text-muted">Cadastro individual para {school.schoolName}.</p>
          <CreateAcademicYearForm schoolId={school.schoolId} />
        </section>
        <section className="min-w-0" aria-labelledby="years-title">
          <h2 id="years-title" className="text-2xl font-bold text-foreground">Anos letivos</h2>
          <AcademicYearList years={years} detailBasePath="/escola/anos" />
        </section>
      </div>
    </AppShell>
  );
}
