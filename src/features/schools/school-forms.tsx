"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import type { SchoolOptionDto } from "@/src/server/schools/service";
import {
  addMembershipAction,
  createSchoolAction,
  selectSchoolAction,
  suspendMembershipAction,
  updateSchoolAction,
  type SchoolActionState,
  type SchoolSelectionState,
} from "./actions";

const initialState: SchoolActionState = { status: "idle" };
const initialSelectionState: SchoolSelectionState = { status: "idle" };

function Result({ state }: { state: SchoolActionState }) {
  if (!state.message) return null;
  return <p role={state.status === "success" ? "status" : "alert"} className={`rounded-control border p-3 text-sm font-medium ${state.status === "success" ? "border-green-200 bg-green-50 text-green-950" : "border-red-200 bg-red-50 text-red-950"}`}>{state.message}</p>;
}

export function CreateSchoolForm() {
  const [state, action, pending] = useActionState(createSchoolAction, initialState);
  return (
    <form action={action} className="grid gap-4" aria-busy={pending || undefined}>
      <Field label="Nome da escola" name="name" maxLength={160} required />
      <Field label="Código externo" hint="Opcional e único na rede." name="externalCode" maxLength={80} />
      <Result state={state} />
      <Button type="submit" busy={pending}>Cadastrar escola</Button>
    </form>
  );
}

export function EditSchoolForm({ school }: { school: { id: string; name: string; externalCode: string | null; status: "ACTIVE" | "INACTIVE"; revision: number } }) {
  const [state, action, pending] = useActionState(updateSchoolAction, initialState);
  return (
    <form action={action} className="grid gap-4" aria-busy={pending || undefined}>
      <input type="hidden" name="schoolId" value={school.id} />
      <input type="hidden" name="revision" value={school.revision} />
      <Field label="Nome da escola" name="name" defaultValue={school.name} maxLength={160} required />
      <Field label="Código externo" name="externalCode" defaultValue={school.externalCode ?? ""} maxLength={80} />
      <label className="grid gap-2 font-semibold text-foreground">Situação
        <select name="status" defaultValue={school.status} className="min-h-11 rounded-control border border-border bg-surface px-3 py-2">
          <option value="ACTIVE">Ativa</option>
          <option value="INACTIVE">Inativa</option>
        </select>
      </label>
      <Result state={state} />
      <Button type="submit" busy={pending}>Salvar escola</Button>
    </form>
  );
}

export function AddMembershipForm({ schoolId }: { schoolId: string }) {
  const [state, action, pending] = useActionState(addMembershipAction, initialState);
  return (
    <form action={action} className="grid gap-4" aria-busy={pending || undefined}>
      <input type="hidden" name="schoolId" value={schoolId} />
      <Field label="E-mail da conta adulta" name="adultEmail" type="email" maxLength={320} required />
      <label className="grid gap-2 font-semibold text-foreground">Papel na escola
        <select name="role" defaultValue="TEACHER" className="min-h-11 rounded-control border border-border bg-surface px-3 py-2">
          <option value="TEACHER">Professor</option>
          <option value="COORDINATOR">Coordenador</option>
        </select>
      </label>
      <Result state={state} />
      <Button type="submit" busy={pending}>Criar vínculo</Button>
    </form>
  );
}

export function SuspendMembershipForm({ membershipId, schoolId, revision }: { membershipId: string; schoolId: string; revision: number }) {
  const [state, action, pending] = useActionState(suspendMembershipAction, initialState);
  return (
    <form action={action} className="grid gap-2" aria-busy={pending || undefined}>
      <input type="hidden" name="membershipId" value={membershipId} />
      <input type="hidden" name="schoolId" value={schoolId} />
      <input type="hidden" name="revision" value={revision} />
      <Button type="submit" variant="danger" busy={pending}>Suspender vínculo</Button>
      <Result state={state} />
    </form>
  );
}

function persistSelection(state: SchoolSelectionState, router: ReturnType<typeof useRouter>) {
  if (state.status !== "success" || !state.userId || !state.schoolId || !state.redirect) return;
  localStorage.setItem(`school:${state.userId}`, state.schoolId);
  localStorage.removeItem(`class:${state.userId}`);
  localStorage.removeItem(`filters:${state.userId}`);
  router.replace(state.redirect);
  router.refresh();
}

export function SchoolSelection({ userId, schools }: { userId: string; schools: SchoolOptionDto[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(selectSchoolAction, initialSelectionState);
  const attemptedPreference = useRef(false);

  useEffect(() => persistSelection(state, router), [state, router]);
  useEffect(() => {
    if (attemptedPreference.current) return;
    attemptedPreference.current = true;
    const key = `school:${userId}`;
    const preferred = localStorage.getItem(key);
    if (!preferred) return;
    if (!schools.some((school) => school.id === preferred)) {
      localStorage.removeItem(key);
      return;
    }
    const data = new FormData();
    data.set("schoolId", preferred);
    startTransition(() => action(data));
  }, [action, schools, userId]);

  useEffect(() => {
    if (state.status === "error" && state.userId && state.schoolId) {
      const key = `school:${state.userId}`;
      if (localStorage.getItem(key) === state.schoolId) localStorage.removeItem(key);
    }
  }, [state]);

  if (schools.length === 0) {
    return <p className="rounded-panel border border-border bg-surface p-5 text-muted">Nenhuma escola ativa está vinculada à sua conta. Solicite a regularização à SEMED.</p>;
  }
  return (
    <div className="grid gap-4" aria-busy={pending || undefined}>
      {pending ? <p role="status" className="text-sm font-semibold text-brand">Validando escola…</p> : null}
      <ul className="grid gap-4 sm:grid-cols-2">
        {schools.map((school) => (
          <li key={school.id} className="rounded-panel border border-border bg-surface p-5">
            <h2 className="text-lg font-bold text-foreground">{school.name}</h2>
            <p className="mt-1 text-sm text-muted">{school.role === "COORDINATOR" ? "Coordenação" : "Professor"}</p>
            <form action={action} className="mt-4">
              <input type="hidden" name="schoolId" value={school.id} />
              <Button type="submit" busy={pending} className="w-full">Acessar escola</Button>
            </form>
          </li>
        ))}
      </ul>
      <Result state={state} />
    </div>
  );
}

export function SchoolSwitcher({ userId, schools, currentSchoolId }: { userId: string; schools: SchoolOptionDto[]; currentSchoolId: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(selectSchoolAction, initialSelectionState);
  useEffect(() => persistSelection(state, router), [state, router]);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2" aria-busy={pending || undefined}>
      <label className="grid gap-1 text-xs font-semibold text-muted">Escola
        <select name="schoolId" defaultValue={currentSchoolId} className="min-h-11 max-w-64 rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground">
          {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
        </select>
      </label>
      <Button type="submit" variant="secondary" busy={pending}>Trocar</Button>
      <Result state={state} />
      <span className="sr-only">Preferência local: school:{userId}</span>
    </form>
  );
}
