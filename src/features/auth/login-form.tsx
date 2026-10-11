"use client";

import { useActionState, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Icon } from "@/src/components/ui/icon";
import { loginAction, type LoginActionState } from "./actions";

const initialLoginState: LoginActionState = { status: "idle" };

export function LoginForm({ requestId }: { requestId: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialLoginState);
  const [showPassword, setShowPassword] = useState(false);

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
        placeholder="nome@educacao.gov.br ou código do aluno"
        maxLength={320}
        required
      />
      <div className="grid gap-2">
        <label htmlFor="login-password" className="font-semibold text-foreground">Senha</label>
        <div className="relative">
          <input id="login-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" minLength={8} maxLength={128} placeholder="Digite sua senha" className="adult-field pr-14" required />
          <button type="button" className="absolute inset-y-0 right-1 my-auto grid size-11 place-items-center rounded-lg text-muted transition hover:bg-blue-50 hover:text-brand" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>
            <Icon name={showPassword ? "eye-off" : "eye"} />
          </button>
        </div>
      </div>
      {state.message ? (
        <p className="rounded-control border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-950" role="alert">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" busy={pending} className="w-full">Entrar com segurança</Button>
    </form>
  );
}
