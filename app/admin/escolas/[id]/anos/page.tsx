import Link from "next/link";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { CreateAcademicYearForm } from "@/src/features/academics/academic-forms";
import { AcademicYearList } from "@/src/features/academics/academic-lists";
import { requireArea } from "@/src/server/auth/guard";
import { listAcademicYears } from "@/src/server/academics/service";
import { getSchoolSummaryForAdmin } from "@/src/server/schools/service";

const navigation = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/escolas", label: "Escolas" },
  { href: "/admin/redefinir-senha-aluno", label: "Redefinir senha de aluno" },
];

export default async function AdminAcademicYearsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireArea("admin");
  const { id } = await params;
  const actor = { ...session.user };
  const [school, years] = await Promise.all([
    getSchoolSummaryForAdmin(actor, id),
    listAcademicYears({ actor, schoolId: id }),
  ]);
  return (
    <AppShell areaLabel="Administração" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel="SEMED">
      <Link href={`/admin/escolas/${school.id}`} className="font-semibold text-brand hover:text-brand-hover">← Voltar à escola</Link>
      <div className="mt-5 grid gap-8 xl:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
        <section className="rounded-panel border border-border bg-surface p-5 sm:p-6" aria-labelledby="admin-new-year-title">
          <h1 id="admin-new-year-title" className="text-2xl font-bold text-foreground">Cadastrar ano letivo</h1>
          <p className="mb-6 mt-2 text-muted">{school.name}</p>
          <CreateAcademicYearForm schoolId={school.id} />
        </section>
        <section className="min-w-0" aria-labelledby="admin-years-title">
          <h2 id="admin-years-title" className="text-2xl font-bold text-foreground">Anos letivos</h2>
          <AcademicYearList years={years} detailBasePath={`/admin/escolas/${school.id}/anos`} />
        </section>
      </div>
    </AppShell>
  );
}
