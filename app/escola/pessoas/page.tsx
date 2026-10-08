import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { schoolNavigation } from "@/src/features/academics/navigation";
import { CreateLocalAdultForm, LinkExistingAdultForm } from "@/src/features/people/people-forms";
import { SchoolPeopleList } from "@/src/features/people/people-lists";
import { SchoolSwitcher } from "@/src/features/schools/school-forms";
import { requireArea } from "@/src/server/auth/guard";
import { listClassGroups } from "@/src/server/academics/service";
import { listSchoolAdults } from "@/src/server/people/service";
import { listAvailableSchools } from "@/src/server/schools/service";

export default async function SchoolPeoplePage() {
  const session = await requireArea("escola");
  const school = session.schoolContext!;
  const actor = { ...session.user };
  const [memberships, classes, schools] = await Promise.all([
    listSchoolAdults({ actor, schoolId: school.schoolId }),
    listClassGroups({ actor, schoolId: school.schoolId }),
    listAvailableSchools(session.user.id),
  ]);
  const activeClasses = classes.filter((group) => group.status === "ACTIVE" && group.academicYear.status === "ACTIVE");
  return (
    <AppShell areaLabel="Coordenação" currentUserLabel={session.user.name} navigation={schoolNavigation} accountAction={<LogoutForm />} contextAction={<SchoolSwitcher userId={session.user.id} schools={schools} currentSchoolId={school.schoolId} />} statusLabel={school.schoolName}>
      <h1 className="text-3xl font-bold text-foreground">Pessoas e atribuições</h1>
      <p className="mt-2 text-muted">Cadastre professores individualmente, reutilize contas existentes e limite o acesso às turmas atribuídas.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-panel border border-border bg-surface p-5 sm:p-6" aria-labelledby="new-teacher-title">
          <h2 id="new-teacher-title" className="text-xl font-bold text-foreground">Novo professor</h2>
          <p className="mb-5 mt-2 text-sm text-muted">Cria a conta e o vínculo somente nesta escola.</p>
          <CreateLocalAdultForm schoolId={school.schoolId} canManageCoordinators={false} />
        </section>
        <section className="rounded-panel border border-border bg-surface p-5 sm:p-6" aria-labelledby="link-teacher-title">
          <h2 id="link-teacher-title" className="text-xl font-bold text-foreground">Professor já cadastrado</h2>
          <p className="mb-5 mt-2 text-sm text-muted">Vincula as mesmas credenciais globais sem duplicar a conta.</p>
          <LinkExistingAdultForm schoolId={school.schoolId} canManageCoordinators={false} />
        </section>
      </div>
      <section className="mt-8" aria-labelledby="school-people-title">
        <h2 id="school-people-title" className="text-2xl font-bold text-foreground">Pessoas da escola</h2>
        <div className="mt-4"><SchoolPeopleList schoolId={school.schoolId} memberships={memberships} classes={activeClasses} canManageCoordinators={false} /></div>
      </section>
    </AppShell>
  );
}
