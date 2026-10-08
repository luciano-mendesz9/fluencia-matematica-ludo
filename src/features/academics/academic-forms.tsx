"use client";

import { useActionState } from "react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import {
  createAcademicYearAction,
  createClassGroupAction,
  updateAcademicYearAction,
  updateClassGroupAction,
  type AcademicActionState,
} from "./actions";

const initialState: AcademicActionState = { status: "idle" };

type AcademicYearOption = {
  id: string;
  year: number;
  status: "ACTIVE" | "INACTIVE";
};

function Result({ state }: { state: AcademicActionState }) {
  if (!state.message) return null;
  return (
    <p
      role={state.status === "success" ? "status" : "alert"}
      className={`rounded-control border p-3 text-sm font-medium ${state.status === "success" ? "border-green-200 bg-green-50 text-green-950" : "border-red-200 bg-red-50 text-red-950"}`}
    >
      {state.message}
    </p>
  );
}

export function CreateAcademicYearForm({ schoolId }: { schoolId: string }) {
  const [state, action, pending] = useActionState(createAcademicYearAction, initialState);
  return (
    <form action={action} className="grid gap-4" aria-busy={pending || undefined}>
      <input type="hidden" name="schoolId" value={schoolId} />
      <Field label="Ano letivo" name="year" type="number" min={2000} max={2100} inputMode="numeric" required />
      <Result state={state} />
      <Button type="submit" busy={pending}>Cadastrar ano</Button>
    </form>
  );
}

export function EditAcademicYearForm({ schoolId, academicYear }: {
  schoolId: string;
  academicYear: { id: string; year: number; status: "ACTIVE" | "INACTIVE"; revision: number };
}) {
  const [state, action, pending] = useActionState(updateAcademicYearAction, initialState);
  return (
    <form action={action} className="grid gap-4" aria-busy={pending || undefined}>
      <input type="hidden" name="schoolId" value={schoolId} />
      <input type="hidden" name="academicYearId" value={academicYear.id} />
      <input type="hidden" name="revision" value={academicYear.revision} />
      <Field label="Ano letivo" name="year" type="number" min={2000} max={2100} inputMode="numeric" defaultValue={academicYear.year} required />
      <label className="grid gap-2 font-semibold text-foreground">
        Situação
        <select name="status" defaultValue={academicYear.status} className="min-h-11 rounded-control border border-border bg-surface px-3 py-2">
          <option value="ACTIVE">Ativo</option>
          <option value="INACTIVE">Inativo</option>
        </select>
      </label>
      <p className="text-sm text-muted">Um ano com turmas ativas não pode ser inativado.</p>
      <Result state={state} />
      <Button type="submit" busy={pending}>Salvar ano letivo</Button>
    </form>
  );
}

function AcademicYearSelect({ years, defaultValue }: { years: AcademicYearOption[]; defaultValue?: string }) {
  return (
    <label className="grid gap-2 font-semibold text-foreground">
      Ano letivo
      <select name="academicYearId" defaultValue={defaultValue} className="min-h-11 rounded-control border border-border bg-surface px-3 py-2" required>
        <option value="" disabled>Selecione</option>
        {years.map((year) => (
          <option key={year.id} value={year.id} disabled={year.status === "INACTIVE" && year.id !== defaultValue}>
            {year.year}{year.status === "INACTIVE" ? " — inativo" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

function GradeSelect({ defaultValue = 1 }: { defaultValue?: number }) {
  return (
    <label className="grid gap-2 font-semibold text-foreground">
      Série
      <select name="grade" defaultValue={String(defaultValue)} className="min-h-11 rounded-control border border-border bg-surface px-3 py-2" required>
        {[1, 2, 3, 4, 5].map((grade) => <option key={grade} value={grade}>{grade}º ano</option>)}
      </select>
    </label>
  );
}

export function CreateClassGroupForm({ schoolId, academicYears }: { schoolId: string; academicYears: AcademicYearOption[] }) {
  const [state, action, pending] = useActionState(createClassGroupAction, initialState);
  const activeYears = academicYears.filter((year) => year.status === "ACTIVE");
  if (activeYears.length === 0) {
    return <p className="rounded-control border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Cadastre ou reative um ano letivo antes de criar turmas.</p>;
  }
  return (
    <form action={action} className="grid gap-4" aria-busy={pending || undefined}>
      <input type="hidden" name="schoolId" value={schoolId} />
      <AcademicYearSelect years={activeYears} defaultValue={activeYears[0]?.id} />
      <GradeSelect />
      <Field label="Nome da turma" hint="Exemplo: Turma A ou 3º A." name="name" maxLength={120} required />
      <Result state={state} />
      <Button type="submit" busy={pending}>Cadastrar turma</Button>
    </form>
  );
}

export function EditClassGroupForm({ schoolId, classGroup, academicYears }: {
  schoolId: string;
  classGroup: {
    id: string;
    academicYearId: string;
    grade: number;
    name: string;
    status: "ACTIVE" | "INACTIVE";
    revision: number;
  };
  academicYears: AcademicYearOption[];
}) {
  const [state, action, pending] = useActionState(updateClassGroupAction, initialState);
  return (
    <form action={action} className="grid gap-4" aria-busy={pending || undefined}>
      <input type="hidden" name="schoolId" value={schoolId} />
      <input type="hidden" name="classGroupId" value={classGroup.id} />
      <input type="hidden" name="revision" value={classGroup.revision} />
      <AcademicYearSelect years={academicYears} defaultValue={classGroup.academicYearId} />
      <GradeSelect defaultValue={classGroup.grade} />
      <Field label="Nome da turma" name="name" defaultValue={classGroup.name} maxLength={120} required />
      <label className="grid gap-2 font-semibold text-foreground">
        Situação
        <select name="status" defaultValue={classGroup.status} className="min-h-11 rounded-control border border-border bg-surface px-3 py-2">
          <option value="ACTIVE">Ativa</option>
          <option value="INACTIVE">Inativa</option>
        </select>
      </label>
      <Result state={state} />
      <Button type="submit" busy={pending}>Salvar turma</Button>
    </form>
  );
}
