import Link from "next/link";

export function AcademicYearList({ years, detailBasePath }: {
  years: Array<{ id: string; year: number; status: "ACTIVE" | "INACTIVE"; _count: { classGroups: number } }>;
  detailBasePath: string;
}) {
  if (years.length === 0) {
    return <p className="mt-4 rounded-panel border border-border bg-surface p-5 text-muted">Nenhum ano letivo cadastrado.</p>;
  }
  return (
    <ul className="mt-4 grid gap-4">
      {years.map((year) => (
        <li key={year.id} className="rounded-panel border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Ano letivo {year.year}</h3>
              <p className="text-sm text-muted">{year.status === "ACTIVE" ? "Ativo" : "Inativo"} · {year._count.classGroups} turma(s)</p>
            </div>
            <Link href={`${detailBasePath}/${year.id}`} className="inline-flex min-h-11 items-center rounded-control border border-brand px-4 font-semibold text-brand hover:bg-blue-50">Ver detalhes</Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ClassGroupList({ groups, detailBasePath }: {
  groups: Array<{
    id: string;
    grade: number;
    name: string;
    status: "ACTIVE" | "INACTIVE";
    academicYear: { year: number };
  }>;
  detailBasePath: string;
}) {
  if (groups.length === 0) {
    return <p className="mt-4 rounded-panel border border-border bg-surface p-5 text-muted">Nenhuma turma cadastrada.</p>;
  }
  return (
    <ul className="mt-4 grid gap-4 sm:grid-cols-2">
      {groups.map((group) => (
        <li key={group.id} className="rounded-panel border border-border bg-surface p-5">
          <h3 className="text-lg font-bold text-foreground">{group.name}</h3>
          <p className="mt-1 text-sm text-muted">{group.grade}º ano · {group.academicYear.year} · {group.status === "ACTIVE" ? "Ativa" : "Inativa"}</p>
          <Link href={`${detailBasePath}/${group.id}`} className="mt-4 inline-flex min-h-11 items-center rounded-control border border-brand px-4 font-semibold text-brand hover:bg-blue-50">Ver detalhes</Link>
        </li>
      ))}
    </ul>
  );
}
