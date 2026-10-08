import Link from "next/link";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { EditSchoolForm } from "@/src/features/schools/school-forms";
import { requireArea } from "@/src/server/auth/guard";
import { getSchoolForAdmin } from "@/src/server/schools/service";

const navigation = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/escolas", label: "Escolas" },
  { href: "/admin/pessoas", label: "Pessoas globais" },
  { href: "/admin/redefinir-senha-aluno", label: "Redefinir senha de aluno" },
];

export default async function SchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireArea("admin");
  const { id } = await params;
  const school = await getSchoolForAdmin({ ...session.user }, id);
  return (
    <AppShell areaLabel="Administração" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel="SEMED">
      <Link href="/admin/escolas" className="font-semibold text-brand hover:text-brand-hover">← Voltar às escolas</Link>
      <h1 className="mt-5 text-3xl font-bold text-foreground">{school.name}</h1>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={`/admin/escolas/${school.id}/anos`} className="inline-flex min-h-11 items-center rounded-control border border-brand px-4 font-semibold text-brand hover:bg-blue-50">Gerenciar anos letivos</Link>
        <Link href={`/admin/escolas/${school.id}/turmas`} className="inline-flex min-h-11 items-center rounded-control border border-brand px-4 font-semibold text-brand hover:bg-blue-50">Gerenciar turmas</Link>
        <Link href={`/admin/escolas/${school.id}/alunos`} className="inline-flex min-h-11 items-center rounded-control border border-brand px-4 font-semibold text-brand hover:bg-blue-50">Gerenciar alunos</Link>
        <Link href={`/admin/escolas/${school.id}/pessoas`} className="inline-flex min-h-11 items-center rounded-control border border-brand px-4 font-semibold text-brand hover:bg-blue-50">Gerenciar pessoas</Link>
      </div>
      <div className="mt-6 grid gap-8">
        <section className="rounded-panel border border-border bg-surface p-5 sm:p-6" aria-labelledby="edit-school-title">
          <h2 id="edit-school-title" className="mb-5 text-xl font-bold">Dados da escola</h2>
          <EditSchoolForm school={school} />
        </section>
      </div>
    </AppShell>
  );
}
