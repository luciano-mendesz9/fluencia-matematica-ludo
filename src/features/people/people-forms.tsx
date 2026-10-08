"use client";

import { useActionState } from "react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import {
  createGlobalAdultAction,
  createLocalAdultAction,
  createTeacherAssignmentAction,
  endTeacherAssignmentAction,
  linkExistingAdultAction,
  suspendLocalMembershipAction,
  updateGlobalAdultStatusAction,
  type PeopleActionState,
} from "./actions";

const initialState: PeopleActionState = { status: "idle" };

function Result({ state }: { state: PeopleActionState }) {
  if (!state.message) return null;
  return <p role={state.status === "success" ? "status" : "alert"} className={`rounded-control border p-3 text-sm font-medium ${state.status === "success" ? "border-green-200 bg-green-50 text-green-950" : "border-red-200 bg-red-50 text-red-950"}`}>{state.message}</p>;
}

function PasswordFields() {
  return (
    <>
      <Field label="Senha temporária" hint="Use pelo menos 12 caracteres, uma letra e um número." name="temporaryPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      <Field label="Confirmar senha temporária" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
    </>
  );
}

function LocalRoleSelect({ canManageCoordinators }: { canManageCoordinators: boolean }) {
  if (!canManageCoordinators) return <input type="hidden" name="role" value="TEACHER" />;
  return (
    <label className="grid gap-2 font-semibold text-foreground">Papel na escola
      <select name="role" defaultValue="TEACHER" className="min-h-11 rounded-control border border-border bg-surface px-3 py-2">
        <option value="TEACHER">Professor</option>
        <option value="COORDINATOR">Coordenador</option>
      </select>
    </label>
  );
}

export function CreateGlobalAdultForm() {
  const [state, action, pending] = useActionState(createGlobalAdultAction, initialState);
  return (
    <form action={action} className="grid gap-4" aria-busy={pending || undefined}>
      <Field label="Nome completo" name="name" autoComplete="name" maxLength={160} required />
      <Field label="E-mail institucional" name="email" type="email" autoComplete="email" maxLength={320} required />
      <label className="grid gap-2 font-semibold text-foreground">Papel global
        <select name="globalRole" defaultValue="DEVELOPER" className="min-h-11 rounded-control border border-border bg-surface px-3 py-2">
          <option value="DEVELOPER">Desenvolvedor</option>
          <option value="SEMED_ADMIN">Administrador SEMED</option>
        </select>
      </label>
      <PasswordFields />
      <Result state={state} />
      <Button type="submit" busy={pending}>Cadastrar conta global</Button>
    </form>
  );
}

export function GlobalAdultStatusForm({ adult }: {
  adult: { id: string; status: "ACTIVE" | "BLOCKED"; revision: number };
}) {
  const [state, action, pending] = useActionState(updateGlobalAdultStatusAction, initialState);
  const targetStatus = adult.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
  return (
    <form action={action} className="grid gap-3" aria-busy={pending || undefined}>
      <input type="hidden" name="userId" value={adult.id} />
      <input type="hidden" name="revision" value={adult.revision} />
      <input type="hidden" name="status" value={targetStatus} />
      <label className="flex items-start gap-3 text-sm font-semibold text-foreground">
        <input type="checkbox" name="confirmation" value="yes" className="mt-1 size-4" required />
        Confirmo a {targetStatus === "BLOCKED" ? "revogação imediata das sessões" : "reativação da conta"}.
      </label>
      <Button type="submit" variant={targetStatus === "BLOCKED" ? "danger" : "secondary"} busy={pending}>{targetStatus === "BLOCKED" ? "Bloquear conta" : "Reativar conta"}</Button>
      <Result state={state} />
    </form>
  );
}

export function CreateLocalAdultForm({ schoolId, canManageCoordinators }: { schoolId: string; canManageCoordinators: boolean }) {
  const [state, action, pending] = useActionState(createLocalAdultAction, initialState);
  return (
    <form action={action} className="grid gap-4" aria-busy={pending || undefined}>
      <input type="hidden" name="schoolId" value={schoolId} />
      <Field label="Nome completo" name="name" autoComplete="name" maxLength={160} required />
      <Field label="E-mail institucional" name="email" type="email" autoComplete="email" maxLength={320} required />
      <LocalRoleSelect canManageCoordinators={canManageCoordinators} />
      <PasswordFields />
      <Result state={state} />
      <Button type="submit" busy={pending}>Cadastrar e vincular</Button>
    </form>
  );
}

export function LinkExistingAdultForm({ schoolId, canManageCoordinators }: { schoolId: string; canManageCoordinators: boolean }) {
  const [state, action, pending] = useActionState(linkExistingAdultAction, initialState);
  return (
    <form action={action} className="grid gap-4" aria-busy={pending || undefined}>
      <input type="hidden" name="schoolId" value={schoolId} />
      <Field label="E-mail da conta existente" hint="A busca não revela vínculos de outras escolas." name="email" type="email" autoComplete="email" maxLength={320} required />
      <LocalRoleSelect canManageCoordinators={canManageCoordinators} />
      <Result state={state} />
      <Button type="submit" variant="secondary" busy={pending}>Vincular conta existente</Button>
    </form>
  );
}

export function SuspendLocalMembershipForm({ schoolId, membershipId, revision }: { schoolId: string; membershipId: string; revision: number }) {
  const [state, action, pending] = useActionState(suspendLocalMembershipAction, initialState);
  return (
    <form action={action} className="grid gap-3" aria-busy={pending || undefined}>
      <input type="hidden" name="schoolId" value={schoolId} />
      <input type="hidden" name="membershipId" value={membershipId} />
      <input type="hidden" name="revision" value={revision} />
      <label className="flex items-start gap-3 text-sm font-semibold text-red-950">
        <input type="checkbox" name="confirmation" value="yes" className="mt-1 size-4" required />
        Confirmo a suspensão e o encerramento das atribuições ativas.
      </label>
      <Button type="submit" variant="danger" busy={pending}>Suspender vínculo</Button>
      <Result state={state} />
    </form>
  );
}

type ClassOption = { id: string; name: string; grade: number; academicYear: { year: number } };

export function CreateTeacherAssignmentForm({ schoolId, membershipId, teacherName, classes }: {
  schoolId: string;
  membershipId: string;
  teacherName: string;
  classes: ClassOption[];
}) {
  const [state, action, pending] = useActionState(createTeacherAssignmentAction, initialState);
  if (classes.length === 0) return <p className="text-sm text-muted">Nenhuma turma ativa disponível.</p>;
  return (
    <form action={action} className="grid gap-3" aria-busy={pending || undefined}>
      <input type="hidden" name="schoolId" value={schoolId} />
      <input type="hidden" name="membershipId" value={membershipId} />
      <label className="grid gap-2 text-sm font-semibold text-foreground">Turma para {teacherName}
        <select name="classId" defaultValue="" className="min-h-11 rounded-control border border-border bg-surface px-3 py-2" required>
          <option value="" disabled>Selecione</option>
          {classes.map((classGroup) => <option key={classGroup.id} value={classGroup.id}>{classGroup.name} · {classGroup.grade}º ano · {classGroup.academicYear.year}</option>)}
        </select>
      </label>
      <Field label="Data final exclusiva" hint="Opcional. À 00h de Fortaleza, o acesso deixa de valer." name="endsOn" type="date" />
      <Result state={state} />
      <Button type="submit" variant="secondary" busy={pending}>Atribuir turma</Button>
    </form>
  );
}

export function EndTeacherAssignmentForm({ schoolId, assignmentId, revision }: { schoolId: string; assignmentId: string; revision: number }) {
  const [state, action, pending] = useActionState(endTeacherAssignmentAction, initialState);
  return (
    <form action={action} className="grid gap-2" aria-busy={pending || undefined}>
      <input type="hidden" name="schoolId" value={schoolId} />
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="revision" value={revision} />
      <label className="flex items-start gap-2 text-xs font-semibold text-red-950">
        <input type="checkbox" name="confirmation" value="yes" className="mt-0.5 size-4" required />
        Confirmo o encerramento.
      </label>
      <Button type="submit" variant="danger" busy={pending}>Encerrar atribuição</Button>
      <Result state={state} />
    </form>
  );
}
