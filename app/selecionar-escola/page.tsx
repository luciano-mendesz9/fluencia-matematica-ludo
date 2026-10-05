import { redirect } from "next/navigation";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { SchoolSelection } from "@/src/features/schools/school-forms";
import { requireArea } from "@/src/server/auth/guard";
import { getSelectedSchoolContext } from "@/src/server/schools/context";
import { listAvailableSchools } from "@/src/server/schools/service";

export default async function SelectSchoolPage() {
  const session = await requireArea("selecionar-escola");
  const selected = await getSelectedSchoolContext(session.user.id);
  if (selected) redirect(selected.destination);
  const schools = await listAvailableSchools(session.user.id);

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">Contexto autorizado</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Selecionar escola</h1>
            <p className="mt-2 text-muted">Olá, {session.user.name}. Escolha um vínculo ativo para continuar.</p>
          </div>
          <LogoutForm />
        </div>
        <div className="mt-8"><SchoolSelection userId={session.user.id} schools={schools} /></div>
      </div>
    </main>
  );
}
