import Link from "next/link";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { CreateStudentForm } from "@/src/features/students/student-forms";
import { requireArea } from "@/src/server/auth/guard";
import { listClassGroups } from "@/src/server/academics/service";
import { getSchoolSummaryForAdmin } from "@/src/server/schools/service";

const navigation = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/escolas", label: "Escolas" },
  { href: "/admin/redefinir-senha-aluno", label: "Redefinir senha de aluno" },
];

export default async function AdminNewStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireArea("admin");
  const { id } = await params;
  const actor = { ...session.user };
  const [school, classes] = await Promise.all([
    getSchoolSummaryForAdmin(actor, id),
    listClassGroups({ actor, schoolId: id }),
  ]);
  const activeClasses = classes.filter((group) => group.status === "ACTIVE" && group.academicYear.status === "ACTIVE");
  return (
    <AppShell areaLabel="Administração" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel="SEMED">
      <Link href={`/admin/escolas/${school.id}/alunos`} className="font-semibold text-brand hover:text-brand-hover">← Voltar aos alunos</Link>
      <section className="mt-5 max-w-2xl rounded-panel border border-border bg-surface p-5 sm:p-7" aria-labelledby="admin-new-student-title">
        <h1 id="admin-new-student-title" className="text-2xl font-bold text-foreground">Cadastrar aluno</h1>
        <p className="mb-6 mt-2 text-muted">{school.name}. O código de acesso será exibido uma única vez.</p>
        <CreateStudentForm schoolId={school.id} classes={activeClasses} />
      </section>
    </AppShell>
  );
}
