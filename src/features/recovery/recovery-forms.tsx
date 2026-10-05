"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import {
  consumeResetAction,
  requestAdultResetAction,
  resetStudentPasswordAction,
  type RecoveryActionState,
} from "./actions";

const initialState: RecoveryActionState = { status: "idle" };

function Result({ state }: { state: RecoveryActionState }) {
  if (!state.message) return null;
  const success = state.status === "success";
  return (
    <p
      className={`rounded-control border p-3 text-sm font-medium ${success ? "border-green-200 bg-green-50 text-green-950" : "border-red-200 bg-red-50 text-red-950"}`}
      role={success ? "status" : "alert"}
    >
      {state.message}
    </p>
  );
}

export function RequestAdultResetForm() {
  const [state, action, pending] = useActionState(requestAdultResetAction, initialState);
  return (
    <form action={action} className="mt-8 grid gap-5" aria-busy={pending || undefined}>
      <Field label="E-mail institucional" name="email" type="email" autoComplete="email" maxLength={320} required />
      <Result state={state} />
      <Button type="submit" busy={pending}>Solicitar recuperação</Button>
    </form>
  );
}

export function ConsumeResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(consumeResetAction, initialState);
  return (
    <form action={action} className="mt-8 grid gap-5" aria-busy={pending || undefined}>
      <input type="hidden" name="token" value={token} />
      <Field label="Nova senha" hint="Use ao menos 12 caracteres, uma letra e um número." name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      <Field label="Confirmar nova senha" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      <Result state={state} />
      <Button type="submit" busy={pending}>Alterar senha</Button>
      {state.status === "success" ? <Link className="font-semibold text-brand hover:text-brand-hover" href="/login">Ir para o login</Link> : null}
    </form>
  );
}

export function AssistedStudentResetForm() {
  const [state, action, pending] = useActionState(resetStudentPasswordAction, initialState);
  return (
    <form action={action} className="grid max-w-xl gap-5" aria-busy={pending || undefined}>
      <Field label="Código do aluno" name="studentCode" type="text" autoComplete="off" autoCapitalize="characters" maxLength={80} required />
      <Field label="Nova senha temporária" hint="Use ao menos 12 caracteres, uma letra e um número." name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      <Field label="Confirmar nova senha" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      <Result state={state} />
      <Button type="submit" busy={pending}>Redefinir senha</Button>
    </form>
  );
}
