"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/src/components/ui/modal";
import {
  CreateLocalAdultForm,
  CreateTeacherAssignmentForm,
  EditLocalTeacherProfileForm,
  EndTeacherAssignmentForm,
  LinkExistingAdultForm,
  SuspendLocalMembershipForm,
} from "./people-forms";

type ClassOption = { id: string; name: string; grade: number; academicYear: { year: number } };
type Assignment = {
  id: string;
  status: "ACTIVE" | "ENDED";
  startsAt: Date;
  endsAt: Date | null;
  revision: number;
  classGroup: { name: string; grade: number; academicYear: { year: number } };
};
type TeacherMembership = {
  id: string;
  role: "COORDINATOR" | "TEACHER";
  status: "ACTIVE" | "SUSPENDED" | "ENDED";
  revision: number;
  user: { id: string; name: string; email: string | null; status: "ACTIVE" | "BLOCKED"; revision: number };
  teacherAssignments: Assignment[];
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Fortaleza", dateStyle: "short" });

function AssignmentHistory({ schoolId, membership, classes }: {
  schoolId: string;
  membership: TeacherMembership;
  classes: ClassOption[];
}) {
  const activeAssignments = membership.teacherAssignments.filter((assignment) => assignment.status === "ACTIVE");
  const availableClasses = classes.filter((classGroup) => !activeAssignments.some((assignment) => assignment.classGroup.name === classGroup.name && assignment.classGroup.academicYear.year === classGroup.academicYear.year));
  return (
    <div className="grid gap-6">
      {membership.status === "ACTIVE" ? <section aria-label={`Dados de ${membership.user.name}`}><h3 className="font-bold">Dados do professor</h3><p className="mb-4 mt-1 text-sm text-muted">Atualize nome e e-mail institucional.</p><EditLocalTeacherProfileForm schoolId={schoolId} membership={membership} /></section> : null}
      <div className="border-t border-border" />
      <section aria-label={`Atribuir turma a ${membership.user.name}`}>
        <h3 className="font-bold">Atribuir nova turma</h3>
        <p className="mb-4 mt-1 text-sm text-muted">As atribuições controlam quais turmas o professor pode acessar.</p>
        {membership.status === "ACTIVE" && membership.user.status === "ACTIVE"
          ? <CreateTeacherAssignmentForm schoolId={schoolId} membershipId={membership.id} teacherName={membership.user.name} classes={availableClasses} />
          : <p className="rounded-control border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">O vínculo e a conta precisam estar ativos.</p>}
      </section>
      <section aria-label={`Atribuições de ${membership.user.name}`}>
        <div className="flex items-center justify-between gap-3"><h3 className="font-bold">Turmas atribuídas</h3><span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-brand">{activeAssignments.length} ativa(s)</span></div>
        {membership.teacherAssignments.length ? <ul className="mt-3 grid gap-3">{membership.teacherAssignments.map((assignment) => (
          <li key={assignment.id} className="rounded-control border border-border bg-background p-4">
            <div className="flex flex-wrap items-start justify-between gap-4"><div><h4 className="font-semibold">{assignment.classGroup.name}</h4><p className="text-sm text-muted">{assignment.classGroup.grade}º ano · {assignment.classGroup.academicYear.year} · {assignment.status === "ACTIVE" ? "Ativa" : "Encerrada"}</p><p className="mt-1 text-xs text-muted">Início: {dateFormatter.format(new Date(assignment.startsAt))}{assignment.endsAt ? ` · Fim: ${dateFormatter.format(new Date(assignment.endsAt))}` : ""}</p></div>{assignment.status === "ACTIVE" ? <EndTeacherAssignmentForm schoolId={schoolId} assignmentId={assignment.id} revision={assignment.revision} /> : null}</div>
          </li>
        ))}</ul> : <p className="mt-3 rounded-control border border-dashed border-border p-4 text-sm text-muted">Nenhuma turma atribuída.</p>}
      </section>
      {membership.status === "ACTIVE" ? <section className="border-t border-border pt-5" aria-label="Suspender professor"><h3 className="font-bold text-red-950">Suspender vínculo</h3><p className="mb-4 mt-1 text-sm text-muted">Remove o acesso a esta escola e encerra as atribuições ativas, preservando o histórico.</p><SuspendLocalMembershipForm schoolId={schoolId} membershipId={membership.id} revision={membership.revision} /></section> : null}
    </div>
  );
}

export function TeacherManagement({ schoolId, memberships, classes }: {
  schoolId: string;
  memberships: TeacherMembership[];
  classes: ClassOption[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [assignment, setAssignment] = useState("all");
  const filtered = useMemo(() => memberships.filter((membership) => {
    const searchable = `${membership.user.name} ${membership.user.email ?? ""}`.toLocaleLowerCase("pt-BR");
    const activeAssignments = membership.teacherAssignments.filter((item) => item.status === "ACTIVE").length;
    return searchable.includes(query.trim().toLocaleLowerCase("pt-BR"))
      && (status === "all" || membership.status === status)
      && (assignment === "all" || (assignment === "assigned" ? activeAssignments > 0 : activeAssignments === 0));
  }), [assignment, memberships, query, status]);
  const active = memberships.filter((membership) => membership.status === "ACTIVE").length;
  const assigned = memberships.filter((membership) => membership.teacherAssignments.some((item) => item.status === "ACTIVE")).length;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-panel border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-sky-50 p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.12em] text-brand">Equipe docente</p><h2 className="mt-2 text-2xl font-bold">Professores da escola</h2><p className="mt-2 max-w-2xl text-muted">Cadastre, vincule e gerencie atribuições sem misturar formulários com a listagem.</p></div><div className="flex flex-wrap gap-3"><Modal trigger="Vincular existente" title="Vincular professor existente" description="Use o e-mail de uma conta já cadastrada, sem duplicar credenciais." triggerVariant="secondary"><LinkExistingAdultForm schoolId={schoolId} canManageCoordinators={false} /></Modal><Modal trigger="＋ Novo professor" title="Cadastrar novo professor" description="Crie a conta e o vínculo exclusivamente como professor desta escola."><CreateLocalAdultForm schoolId={schoolId} canManageCoordinators={false} /></Modal></div></div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Resumo de professores"><article className="rounded-panel border border-border bg-surface p-5"><p className="text-sm font-semibold text-muted">Professores</p><p className="mt-2 text-3xl font-bold">{memberships.length}</p></article><article className="rounded-panel border border-border bg-surface p-5"><p className="text-sm font-semibold text-muted">Vínculos ativos</p><p className="mt-2 text-3xl font-bold text-brand">{active}</p></article><article className="rounded-panel border border-border bg-surface p-5"><p className="text-sm font-semibold text-muted">Com turma atribuída</p><p className="mt-2 text-3xl font-bold">{assigned}</p></article></section>

      <section className="rounded-panel border border-border bg-surface shadow-sm" aria-labelledby="teacher-table-title">
        <div className="border-b border-border p-5 sm:p-6"><h2 id="teacher-table-title" className="text-xl font-bold">Lista de professores</h2><p className="mt-1 text-sm text-muted">{filtered.length} de {memberships.length} professor(es) exibido(s).</p><div className="mt-5 grid gap-3 md:grid-cols-[minmax(15rem,1fr)_12rem_14rem]"><label className="grid gap-2 text-sm font-semibold">Buscar professor<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome ou e-mail" className="min-h-11 rounded-control border border-border bg-white px-3 py-2 font-normal" /></label><label className="grid gap-2 text-sm font-semibold">Vínculo<select value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-11 rounded-control border border-border bg-white px-3 py-2 font-normal"><option value="all">Todos</option><option value="ACTIVE">Ativos</option><option value="SUSPENDED">Suspensos</option><option value="ENDED">Encerrados</option></select></label><label className="grid gap-2 text-sm font-semibold">Atribuições<select value={assignment} onChange={(event) => setAssignment(event.target.value)} className="min-h-11 rounded-control border border-border bg-white px-3 py-2 font-normal"><option value="all">Todas</option><option value="assigned">Com turma ativa</option><option value="unassigned">Sem turma ativa</option></select></label></div></div>
        {filtered.length ? <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-3">Professor</th><th className="px-5 py-3">Vínculo</th><th className="px-5 py-3">Conta</th><th className="px-5 py-3">Turmas ativas</th><th className="px-5 py-3 text-right">Ação</th></tr></thead><tbody>{filtered.map((membership) => { const activeAssignments = membership.teacherAssignments.filter((item) => item.status === "ACTIVE"); return <tr key={membership.id} className="border-t border-border transition hover:bg-blue-50/40"><th className="px-5 py-4"><span className="block font-bold">{membership.user.name}</span><span className="mt-1 block break-all text-xs font-normal text-muted">{membership.user.email}</span></th><td className="px-5 py-4">{membership.status === "ACTIVE" ? "Ativo" : membership.status === "SUSPENDED" ? "Suspenso" : "Encerrado"}</td><td className="px-5 py-4">{membership.user.status === "ACTIVE" ? "Ativa" : "Bloqueada"}</td><td className="px-5 py-4">{activeAssignments.length ? activeAssignments.map((item) => item.classGroup.name).join(", ") : "Nenhuma"}</td><td className="px-5 py-4 text-right"><Modal trigger="Editar professor" title={membership.user.name} description="Gerencie turmas atribuídas e o vínculo deste professor." triggerVariant="secondary" triggerClassName="px-3" size="lg"><AssignmentHistory schoolId={schoolId} membership={membership} classes={classes} /></Modal></td></tr>; })}</tbody></table></div> : <div className="p-10 text-center"><p className="font-bold">Nenhum professor encontrado</p><p className="mt-1 text-sm text-muted">Ajuste os filtros ou cadastre um novo professor.</p></div>}
      </section>
    </div>
  );
}
