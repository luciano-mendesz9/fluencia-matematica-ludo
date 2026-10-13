import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/src/components/layout/app-shell";
import { Feedback } from "@/src/components/ui/feedback";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { ProgressBar, StatusPill } from "@/src/features/management/management-tables";
import { SchoolSwitcher } from "@/src/features/schools/school-forms";
import { getAuthorizedAnalytics } from "@/src/server/analytics/service";
import { AuthorizationError } from "@/src/server/auth/errors";
import { requireArea } from "@/src/server/auth/guard";
import { getTeacherClassManagement } from "@/src/server/management/service";
import { listAvailableSchools } from "@/src/server/schools/service";

const navigation = [{ href: "/professor", label: "Visão geral" }, { href: "/professor/turmas", label: "Minhas turmas" }, { href: "/atividades", label: "Atividades" }, { href: "/professor/relatorios", label: "Resultados" }, { href: "/questoes", label: "Banco de questões" }];

export default async function TeacherStudentDetailPage({ params }: { params: Promise<{ id: string; studentId: string }> }) {
  const session = await requireArea("professor");
  const school = session.schoolContext!;
  const { id, studentId } = await params;
  const actor = { ...session.user };
  let data;
  try {
    data = await Promise.all([
      getTeacherClassManagement({ actor, schoolId: school.schoolId, classId: id }),
      getAuthorizedAnalytics({ actor, filters: { schoolId: school.schoolId, classId: id, studentId } }),
      listAvailableSchools(session.user.id),
    ]);
  } catch (error) {
    if (error instanceof AuthorizationError && ["NOT_FOUND", "FORBIDDEN"].includes(error.code)) notFound();
    throw error;
  }
  const [overview, analytics, schools] = data;
  const student = overview.students.find((item) => item.id === studentId);
  if (!student) notFound();
  const detail = analytics.students.find((item) => item.studentId === studentId);
  return <AppShell areaLabel="Professor" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} contextAction={<SchoolSwitcher userId={session.user.id} schools={schools} currentSchoolId={school.schoolId} />} statusLabel={school.schoolName}>
      <div className="space-y-8"><header><Link href={`/professor/turmas/${id}`} className="font-bold text-brand">← Voltar para {overview.group.name}</Link><p className="mt-5 text-sm font-bold uppercase tracking-[0.12em] text-brand">Acompanhamento individual</p><h1 className="mt-1 text-3xl font-bold">{student.name}</h1><p className="mt-2 max-w-3xl text-muted">Resultados das atividades deste professor na turma. A conta e a matrícula são administradas pela coordenação; esta tela não expõe código de acesso.</p></header>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo individual"><div className="adult-card p-5"><p className="text-sm font-semibold text-muted">Respostas</p><p className="mt-2 text-3xl font-extrabold">{detail?.answers ?? 0}</p><p className="text-xs text-muted">{detail?.distinctQuestions ?? 0} questões distintas</p></div><div className="adult-card p-5"><p className="text-sm font-semibold text-muted">Precisão</p><div className="mt-3"><ProgressBar value={detail?.precisionPercent ?? null} label="Precisão individual" /></div></div><div className="adult-card p-5"><p className="text-sm font-semibold text-muted">Atividades respondidas</p><p className="mt-2 text-3xl font-extrabold">{student.respondedActivities}</p><p className="text-xs text-muted">{student.pendingActivities} pendência(s)</p></div><div className="adult-card p-5"><p className="text-sm font-semibold text-muted">Leitura responsável</p><div className="mt-3"><StatusPill tone={student.performance.tone}>{student.performance.label}</StatusPill></div><p className="mt-2 text-xs text-muted">Não representa diagnóstico ou nota.</p></div></section>
        <section aria-labelledby="student-evidence-title"><h2 id="student-evidence-title" className="text-xl font-bold">Evidências por habilidade</h2><p className="mt-1 text-sm text-muted">Precisão, cobertura e repetição são mostradas separadamente.</p><div className="mt-4 overflow-x-auto rounded-panel border border-border bg-surface"><table className="min-w-full text-left text-sm"><thead className="bg-blue-50"><tr><th className="px-4 py-3">Tema / habilidade</th><th className="px-4 py-3">Dificuldade</th><th className="px-4 py-3">Respostas</th><th className="px-4 py-3">Precisão</th><th className="px-4 py-3">Cobertura</th></tr></thead><tbody>{analytics.groups.map((group) => <tr key={group.key} className="border-t border-border"><th className="px-4 py-3 font-semibold">{group.themeName}{group.skillName ? ` · ${group.skillName}` : ""}</th><td className="px-4 py-3">{group.difficulty}</td><td className="px-4 py-3">{group.answers}</td><td className="px-4 py-3">{group.precisionPercent === null ? "—" : `${group.precisionPercent}%`}</td><td className="px-4 py-3">{group.distinctQuestions} distintas · {group.repetitions} repetições</td></tr>)}{analytics.groups.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">Ainda não há respostas no recorte.</td></tr> : null}</tbody></table></div></section>
        <section aria-labelledby="student-feedback-title"><h2 id="student-feedback-title" className="text-xl font-bold">Feedback baseado em regras</h2><div className="mt-4 grid gap-4 lg:grid-cols-2">{analytics.feedback.map((item, index) => <Feedback key={`${item.skillId ?? item.themeName}-${item.difficulty}-${index}`} title={`${item.skillName ?? item.themeName} · dificuldade ${item.difficulty}`} variant={item.status === "REVIEW" ? "warning" : "info"}>{item.message} Evidência: {item.distinctQuestions} questões distintas e {item.repetitions} repetições.</Feedback>)}{analytics.feedback.length === 0 ? <Feedback title="Dados insuficientes" variant="info">Ainda não há evidência suficiente para uma observação descritiva.</Feedback> : null}</div></section>
      </div>
    </AppShell>;
}
