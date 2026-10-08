import Link from "next/link";

export function StudentList({ students, detailBasePath }: {
  students: Array<{
    id: string;
    name: string;
    status: "ACTIVE" | "BLOCKED";
    enrollmentCount: number;
    activeEnrollment: null | {
      classGroup: { name: string; grade: number; academicYear: { year: number } };
    };
  }>;
  detailBasePath: string;
}) {
  if (students.length === 0) {
    return <p className="rounded-panel border border-border bg-surface p-5 text-muted">Nenhum aluno cadastrado nesta escola.</p>;
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {students.map((student) => (
        <li key={student.id} className="rounded-panel border border-border bg-surface p-5">
          <h2 className="text-lg font-bold text-foreground">{student.name}</h2>
          {student.activeEnrollment ? (
            <p className="mt-1 text-sm text-muted">{student.activeEnrollment.classGroup.name} · {student.activeEnrollment.classGroup.grade}º ano · {student.activeEnrollment.classGroup.academicYear.year}</p>
          ) : <p className="mt-1 text-sm text-muted">Sem matrícula ativa</p>}
          <p className="mt-1 text-xs text-muted">{student.enrollmentCount} matrícula(s) no histórico · conta {student.status === "ACTIVE" ? "ativa" : "bloqueada"}</p>
          <Link href={`${detailBasePath}/${student.id}`} className="mt-4 inline-flex min-h-11 items-center rounded-control border border-brand px-4 font-semibold text-brand hover:bg-blue-50">Ver aluno</Link>
        </li>
      ))}
    </ul>
  );
}
