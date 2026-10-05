"use client";

import { useActionState } from "react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { loginAction, type LoginActionState } from "./actions";

const initialLoginState: LoginActionState = { status: "idle" };

export function LoginForm({ requestId }: { requestId: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialLoginState);

  return (
    <form action={formAction} className="mt-8 grid gap-5" aria-busy={pending || undefined}>
      <input type="hidden" name="requestId" value={requestId} />
      <Field
        label="E-mail ou código do aluno"
        name="identifier"
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={320}
        required
      />
      <Field
        label="Senha"
        name="password"
        type="password"
        autoComplete="current-password"
        minLength={8}
        maxLength={128}
        required
      />
      {state.message ? (
        <p className="rounded-control border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-950" role="alert">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" busy={pending} className="w-full">Entrar</Button>
    </form>
  );
}
