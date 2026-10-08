import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/src/components/layout/app-shell";
import { StructurePanel } from "@/src/components/layout/structure-panel";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { SchoolSwitcher } from "@/src/features/schools/school-forms";
import { schoolNavigation } from "@/src/features/academics/navigation";
import { requireArea } from "@/src/server/auth/guard";
import { listAvailableSchools } from "@/src/server/schools/service";

export default async function SchoolPage() {
  const session = await requireArea("escola");
  const schoolContext = session.schoolContext;
  if (!schoolContext) redirect("/selecionar-escola");
  const schools = await listAvailableSchools(session.user.id);
  return (
    <AppShell areaLabel="Coordenação" currentUserLabel={session.user.name} navigation={schoolNavigation} accountAction={<LogoutForm />} contextAction={<SchoolSwitcher userId={session.user.id} schools={schools} currentSchoolId={schoolContext.schoolId} />} statusLabel={schoolContext.schoolName}>
      <StructurePanel title={`Coordenação — ${schoolContext.schoolName}`} description="Gerencie os anos letivos e as turmas da escola selecionada. O vínculo e o contexto são revalidados no servidor em cada operação." />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link href="/escola/anos" className="rounded-panel border border-border bg-surface p-5 hover:border-brand">
          <h2 className="text-lg font-bold text-foreground">Anos letivos</h2>
          <p className="mt-2 text-sm text-muted">Cadastre e acompanhe os períodos escolares.</p>
        </Link>
        <Link href="/escola/turmas" className="rounded-panel border border-border bg-surface p-5 hover:border-brand">
          <h2 className="text-lg font-bold text-foreground">Turmas</h2>
          <p className="mt-2 text-sm text-muted">Organize turmas do 1º ao 5º ano.</p>
        </Link>
        <Link href="/escola/alunos" className="rounded-panel border border-border bg-surface p-5 hover:border-brand">
          <h2 className="text-lg font-bold text-foreground">Alunos</h2>
          <p className="mt-2 text-sm text-muted">Cadastre alunos e gerencie matrículas individualmente.</p>
        </Link>
        <Link href="/escola/pessoas" className="rounded-panel border border-border bg-surface p-5 hover:border-brand">
          <h2 className="text-lg font-bold text-foreground">Pessoas e atribuições</h2>
          <p className="mt-2 text-sm text-muted">Cadastre professores e limite o acesso às turmas vigentes.</p>
        </Link>
      </div>
    </AppShell>
  );
}
