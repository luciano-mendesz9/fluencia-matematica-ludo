"use client";

import { useActionState } from "react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import {
  createStudentAction,
  endEnrollmentAction,
  resetEnrolledStudentPasswordAction,
  transferStudentAction,
  type StudentActionState,
} from "./actions";

type ClassOption = {
  id: string;
  name: string;
  grade: number;
  academicYear: { year: number };
};

const initialState: StudentActionState = { status: "idle" };

function Result({ state }: { state: StudentActionState }) {
  if (!state.message && !state.studentCode) return null;
  return (
    <div role={state.status === "success" ? "status" : "alert"} className={`rounded-control border p-4 text-sm ${state.status === "success" ? "border-green-200 bg-green-50 text-green-950" : "border-red-200 bg-red-50 text-red-950"}`}>
      {state.message ? <p className="font-semibold">{state.message}</p> : null}
      {state.studentCode ? (
        <div className="mt-3">
          <p>Copie o código agora. Ele não será exibido novamente.</p>
          <output aria-label="Código de acesso do aluno" className="mt-2 block break-all rounded-control border border-green-300 bg-white p-3 font-mono text-lg font-bold tracking-wide text-foreground">{state.studentCode}</output>
        </div>
      ) : null}
    </div>
  );
}

function ClassSelect({ classes, name = "classId", defaultValue }: { classes: ClassOption[]; name?: string; defaultValue?: string }) {
  return (
    <label className="grid gap-2 font-semibold text-foreground">
      Turma
      <select name={name} defaultValue={defaultValue ?? ""} className="min-h-11 rounded-control border border-border bg-surface px-3 py-2" required>
        <option value="" disabled>Selecione</option>
        {classes.map((classGroup) => (
          <option key={classGroup.id} value={classGroup.id}>{classGroup.name} · {classGroup.grade}º ano · {classGroup.academicYear.year}</option>
        ))}
      </select>
    </label>
  );
}

export function CreateStudentForm({ schoolId, classes }: { schoolId: string; classes: ClassOption[] }) {
  const [state, action, pending] = useActionState(createStudentAction, initialState);
  if (classes.length === 0) {
    return <p className="rounded-control border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Cadastre uma turma ativa em um ano letivo ativo antes de cadastrar alunos.</p>;
  }
  return (
    <form action={action} className="grid gap-4" aria-busy={pending || undefined}>
      <input type="hidden" name="schoolId" value={schoolId} />
      <Field label="Nome do aluno" name="name" autoComplete="name" maxLength={160} required />
      <ClassSelect classes={classes} />
      <Field label="Senha temporária" hint="Use pelo menos 12 caracteres, uma letra e um número." name="temporaryPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      <Field label="Confirmar senha temporária" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      <Result state={state} />
      <Button type="submit" busy={pending}>Cadastrar aluno</Button>
    </form>
  );
}

export function TransferStudentForm({ schoolId, studentId, enrollmentRevision, classes }: {
  schoolId: string;
  studentId: string;
  enrollmentRevision: number;
  classes: ClassOption[];
}) {
  const [state, action, pending] = useActionState(transferStudentAction, initialState);
  if (classes.length === 0) return <p className="text-sm text-muted">Não há outra turma ativa disponível para transferência.</p>;
  return (
    <form action={action} className="grid gap-4" aria-busy={pending || undefined}>
      <input type="hidden" name="schoolId" value={schoolId} />
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="enrollmentRevision" value={enrollmentRevision} />
      <ClassSelect classes={classes} name="targetClassId" />
      <Result state={state} />
      <Button type="submit" busy={pending}>Transferir aluno</Button>
    </form>
  );
}

export function EndEnrollmentForm({ schoolId, studentId, enrollmentRevision }: {
  schoolId: string;
  studentId: string;
  enrollmentRevision: number;
}) {
  const [state, action, pending] = useActionState(endEnrollmentAction, initialState);
  return (
    <form action={action} className="grid gap-3" aria-busy={pending || undefined}>
      <input type="hidden" name="schoolId" value={schoolId} />
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="enrollmentRevision" value={enrollmentRevision} />
      <p className="text-sm text-muted">O encerramento não apaga o aluno nem o histórico da matrícula.</p>
      <label className="flex items-start gap-3 rounded-control border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-950">
        <input type="checkbox" name="confirmation" value="yes" className="mt-1 size-4" required />
        Confirmo que desejo encerrar a matrícula ativa.
      </label>
      <Result state={state} />
      <Button type="submit" variant="danger" busy={pending}>Encerrar matrícula</Button>
    </form>
  );
}

export function ResetStudentPasswordForm({ schoolId, studentId }: { schoolId: string; studentId: string }) {
  const [state, action, pending] = useActionState(resetEnrolledStudentPasswordAction, initialState);
  return (
    <form action={action} className="grid gap-4" aria-busy={pending || undefined}>
      <input type="hidden" name="schoolId" value={schoolId} />
      <input type="hidden" name="studentId" value={studentId} />
      <Field label="Nova senha" name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      <Field label="Confirmar nova senha" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      <Result state={state} />
      <Button type="submit" variant="secondary" busy={pending}>Redefinir senha</Button>
    </form>
  );
}
