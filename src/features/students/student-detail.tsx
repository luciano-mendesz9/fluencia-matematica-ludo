import Link from "next/link";
import { EndEnrollmentForm, ResetStudentPasswordForm, TransferStudentForm } from "./student-forms";

type ClassOption = {
  id: string;
  name: string;
  grade: number;
  academicYear: { year: number };
};

type Enrollment = {
  id: string;
  classId: string;
  status: "ACTIVE" | "ENDED";
  startsAt: Date;
  endsAt: Date | null;
  revision: number;
  classGroup: { name: string; grade: number; academicYear: { year: number } };
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Fortaleza", dateStyle: "short" });

export function StudentDetail({
  student,
  schoolId,
  activeClasses,
  backHref,
  canResetPassword,
}: {
  student: {
    id: string;
    name: string;
    status: "ACTIVE" | "BLOCKED";
    enrollments: Enrollment[];
    activeEnrollment: Enrollment | null;
  };
  schoolId: string;
  activeClasses: ClassOption[];
  backHref: string;
  canResetPassword: boolean;
}) {
  const transferTargets = student.activeEnrollment
    ? activeClasses.filter((classGroup) => classGroup.id !== student.activeEnrollment?.classId)
    : [];
  return (
    <>
      <Link href={backHref} className="font-semibold text-brand hover:text-brand-hover">← Voltar aos alunos</Link>
      <h1 className="mt-5 text-3xl font-bold text-foreground">{student.name}</h1>
      <p className="mt-2 text-muted">Conta {student.status === "ACTIVE" ? "ativa" : "bloqueada"}. O código de acesso não é exibido nesta tela.</p>

      {student.activeEnrollment ? (
        <section className="mt-6 rounded-panel border border-border bg-surface p-5 sm:p-6" aria-labelledby="current-enrollment-title">
          <h2 id="current-enrollment-title" className="text-xl font-bold text-foreground">Matrícula atual</h2>
          <p className="mt-2 text-muted">{student.activeEnrollment.classGroup.name} · {student.activeEnrollment.classGroup.grade}º ano · {student.activeEnrollment.classGroup.academicYear.year}</p>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-4 font-bold text-foreground">Transferir de turma</h3>
              <TransferStudentForm schoolId={schoolId} studentId={student.id} enrollmentRevision={student.activeEnrollment.revision} classes={transferTargets} />
            </div>
            <div>
              <h3 className="mb-4 font-bold text-foreground">Encerrar matrícula</h3>
              <EndEnrollmentForm schoolId={schoolId} studentId={student.id} enrollmentRevision={student.activeEnrollment.revision} />
            </div>
          </div>
        </section>
      ) : (
        <p className="mt-6 rounded-panel border border-amber-200 bg-amber-50 p-5 text-amber-950">Este aluno não possui matrícula ativa nesta escola.</p>
      )}

      {canResetPassword ? (
        <section className="mt-6 max-w-2xl rounded-panel border border-border bg-surface p-5 sm:p-6" aria-labelledby="reset-student-title">
          <h2 id="reset-student-title" className="text-xl font-bold text-foreground">Redefinir senha</h2>
          <p className="mb-5 mt-2 text-sm text-muted">A redefinição revoga as sessões anteriores e é registrada em auditoria.</p>
          <ResetStudentPasswordForm schoolId={schoolId} studentId={student.id} />
        </section>
      ) : null}

      <section className="mt-8" aria-labelledby="enrollment-history-title">
        <h2 id="enrollment-history-title" className="text-2xl font-bold text-foreground">Histórico de matrículas</h2>
        <ul className="mt-4 grid gap-4">
          {student.enrollments.map((enrollment) => (
            <li key={enrollment.id} className="rounded-panel border border-border bg-surface p-5">
              <h3 className="font-bold text-foreground">{enrollment.classGroup.name}</h3>
              <p className="mt-1 text-sm text-muted">{enrollment.classGroup.grade}º ano · {enrollment.classGroup.academicYear.year} · {enrollment.status === "ACTIVE" ? "Ativa" : "Encerrada"}</p>
              <p className="mt-1 text-xs text-muted">Início: {dateFormatter.format(enrollment.startsAt)}{enrollment.endsAt ? ` · Encerramento: ${dateFormatter.format(enrollment.endsAt)}` : ""}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
