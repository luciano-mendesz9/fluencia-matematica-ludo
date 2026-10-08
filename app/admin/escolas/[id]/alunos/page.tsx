import Link from "next/link";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { StudentList } from "@/src/features/students/student-list";
import { requireArea } from "@/src/server/auth/guard";
import { getSchoolSummaryForAdmin } from "@/src/server/schools/service";
import { listStudents } from "@/src/server/students/service";

const navigation = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/escolas", label: "Escolas" },
  { href: "/admin/redefinir-senha-aluno", label: "Redefinir senha de aluno" },
];

export default async function AdminStudentsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireArea("admin");
  const { id } = await params;
  const actor = { ...session.user };
  const [school, students] = await Promise.all([
    getSchoolSummaryForAdmin(actor, id),
    listStudents({ actor, schoolId: id }),
  ]);
  return (
    <AppShell areaLabel="Administração" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel="SEMED">
      <Link href={`/admin/escolas/${school.id}`} className="font-semibold text-brand hover:text-brand-hover">← Voltar à escola</Link>
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alunos</h1>
          <p className="mt-2 text-muted">Cadastro individual e histórico de matrículas de {school.name}.</p>
        </div>
        <Link href={`/admin/escolas/${school.id}/alunos/novo`} className="inline-flex min-h-11 items-center rounded-control border border-brand bg-brand px-5 font-semibold text-white hover:bg-brand-hover">Cadastrar aluno</Link>
      </div>
      <div className="mt-6"><StudentList students={students} detailBasePath={`/admin/escolas/${school.id}/alunos`} /></div>
    </AppShell>
  );
}
