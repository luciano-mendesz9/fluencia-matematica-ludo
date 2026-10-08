import {
  CreateTeacherAssignmentForm,
  EndTeacherAssignmentForm,
  GlobalAdultStatusForm,
  SuspendLocalMembershipForm,
} from "./people-forms";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Fortaleza", dateStyle: "short" });

export function GlobalAdultList({ adults }: {
  adults: Array<{
    id: string;
    name: string;
    email: string | null;
    globalRole: "SEMED_ADMIN" | "DEVELOPER" | null;
    status: "ACTIVE" | "BLOCKED";
    revision: number;
  }>;
}) {
  if (adults.length === 0) return <p className="rounded-panel border border-border bg-surface p-5 text-muted">Nenhuma conta global cadastrada.</p>;
  return (
    <ul className="grid gap-4">
      {adults.map((adult) => (
        <li key={adult.id} className="rounded-panel border border-border bg-surface p-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,24rem)]">
            <div>
              <h2 className="text-lg font-bold text-foreground">{adult.name}</h2>
              <p className="mt-1 break-all text-sm text-muted">{adult.email}</p>
              <p className="mt-1 text-sm text-muted">{adult.globalRole === "SEMED_ADMIN" ? "Administrador SEMED" : "Desenvolvedor"} · {adult.status === "ACTIVE" ? "Ativo" : "Bloqueado"}</p>
            </div>
            <GlobalAdultStatusForm adult={adult} />
          </div>
        </li>
      ))}
    </ul>
  );
}

type Assignment = {
  id: string;
  status: "ACTIVE" | "ENDED";
  startsAt: Date;
  endsAt: Date | null;
  revision: number;
  classGroup: { name: string; grade: number; academicYear: { year: number } };
};

type Membership = {
  id: string;
  role: "COORDINATOR" | "TEACHER";
  status: "ACTIVE" | "SUSPENDED" | "ENDED";
  startsAt: Date;
  endsAt: Date | null;
  revision: number;
  user: { id: string; name: string; email: string | null; status: "ACTIVE" | "BLOCKED" };
  teacherAssignments: Assignment[];
};

export function SchoolPeopleList({ schoolId, memberships, classes, canManageCoordinators }: {
  schoolId: string;
  memberships: Membership[];
  classes: Array<{ id: string; name: string; grade: number; academicYear: { year: number } }>;
  canManageCoordinators: boolean;
}) {
  if (memberships.length === 0) return <p className="rounded-panel border border-border bg-surface p-5 text-muted">Nenhum adulto vinculado a esta escola.</p>;
  return (
    <ul className="grid gap-5">
      {memberships.map((membership) => {
        const canManage = membership.role === "TEACHER" || canManageCoordinators;
        const activeAssignments = membership.teacherAssignments.filter((assignment) => assignment.status === "ACTIVE");
        return (
          <li key={membership.id} className="rounded-panel border border-border bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">{membership.user.name}</h2>
                <p className="mt-1 break-all text-sm text-muted">{membership.user.email}</p>
                <p className="mt-1 text-sm text-muted">{membership.role === "COORDINATOR" ? "Coordenador" : "Professor"} · vínculo {membership.status === "ACTIVE" ? "ativo" : "encerrado"} · conta {membership.user.status === "ACTIVE" ? "ativa" : "bloqueada"}</p>
              </div>
              {membership.status === "ACTIVE" && canManage ? <div className="max-w-sm"><SuspendLocalMembershipForm schoolId={schoolId} membershipId={membership.id} revision={membership.revision} /></div> : null}
            </div>

            {membership.role === "TEACHER" ? (
              <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(16rem,24rem)_minmax(0,1fr)]">
                <section aria-label={`Nova atribuição de ${membership.user.name}`}>
                  <h3 className="mb-3 font-bold text-foreground">Atribuir turma</h3>
                  {membership.status === "ACTIVE" && membership.user.status === "ACTIVE"
                    ? <CreateTeacherAssignmentForm schoolId={schoolId} membershipId={membership.id} teacherName={membership.user.name} classes={classes} />
                    : <p className="text-sm text-muted">O vínculo e a conta precisam estar ativos.</p>}
                </section>
                <section aria-label={`Atribuições de ${membership.user.name}`}>
                  <h3 className="font-bold text-foreground">Histórico de atribuições</h3>
                  {membership.teacherAssignments.length === 0 ? <p className="mt-3 text-sm text-muted">Nenhuma turma atribuída.</p> : (
                    <ul className="mt-3 grid gap-3">
                      {membership.teacherAssignments.map((assignment) => (
                        <li key={assignment.id} className="rounded-control border border-border bg-background p-4">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <h4 className="font-semibold text-foreground">{assignment.classGroup.name}</h4>
                              <p className="text-sm text-muted">{assignment.classGroup.grade}º ano · {assignment.classGroup.academicYear.year} · {assignment.status === "ACTIVE" ? "Ativa" : "Encerrada"}</p>
                              <p className="mt-1 text-xs text-muted">Início: {dateFormatter.format(assignment.startsAt)}{assignment.endsAt ? ` · Fim: ${dateFormatter.format(assignment.endsAt)}` : ""}</p>
                            </div>
                            {assignment.status === "ACTIVE" && canManage ? <div className="max-w-xs"><EndTeacherAssignmentForm schoolId={schoolId} assignmentId={assignment.id} revision={assignment.revision} /></div> : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {activeAssignments.length > 0 ? <p className="mt-3 text-xs text-muted">{activeAssignments.length} atribuição(ões) ativa(s).</p> : null}
                </section>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
