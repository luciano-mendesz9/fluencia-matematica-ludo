"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Modal } from "@/src/components/ui/modal";
import { CreateAcademicYearForm, CreateClassGroupForm, EditClassGroupForm } from "./academic-forms";

type AcademicYear = {
  id: string;
  year: number;
  status: "ACTIVE" | "INACTIVE";
  revision: number;
  _count: { classGroups: number };
};

type ClassGroup = {
  id: string;
  academicYearId: string;
  grade: number;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  revision: number;
  academicYear: { year: number; status: "ACTIVE" | "INACTIVE" };
};

export function ClassManagement({ schoolId, academicYears, groups }: {
  schoolId: string;
  academicYears: AcademicYear[];
  groups: ClassGroup[];
}) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");
  const [status, setStatus] = useState("all");
  const filteredGroups = useMemo(() => groups.filter((group) => {
    const matchesQuery = group.name.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR"));
    const matchesYear = year === "all" || String(group.academicYear.year) === year;
    const matchesStatus = status === "all" || group.status === status;
    return matchesQuery && matchesYear && matchesStatus;
  }), [groups, query, status, year]);
  const activeGroups = groups.filter((group) => group.status === "ACTIVE").length;
  const activeYears = academicYears.filter((item) => item.status === "ACTIVE").length;

  return (
    <div className="mt-8 space-y-6">
      <section className="overflow-hidden rounded-panel border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-sky-50 p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand">Organização acadêmica</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Turmas em um só lugar</h2>
            <p className="mt-2 text-muted">Encontre, abra e edite turmas sem misturar os formulários com a listagem.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Modal trigger="＋ Novo ano letivo" title="Cadastrar ano letivo" description="O novo ano ficará disponível para a criação de turmas." triggerVariant="secondary">
              <CreateAcademicYearForm schoolId={schoolId} />
            </Modal>
            <Modal trigger="＋ Nova turma" title="Cadastrar nova turma" description="Defina o ano letivo, a série e um nome fácil de reconhecer.">
              <CreateClassGroupForm schoolId={schoolId} academicYears={academicYears} />
            </Modal>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Resumo das turmas">
        <article className="rounded-panel border border-border bg-surface p-5 shadow-sm"><p className="text-sm font-semibold text-muted">Total de turmas</p><p className="mt-2 text-3xl font-bold text-foreground">{groups.length}</p></article>
        <article className="rounded-panel border border-border bg-surface p-5 shadow-sm"><p className="text-sm font-semibold text-muted">Turmas ativas</p><p className="mt-2 text-3xl font-bold text-brand">{activeGroups}</p></article>
        <article className="rounded-panel border border-border bg-surface p-5 shadow-sm"><p className="text-sm font-semibold text-muted">Anos letivos ativos</p><p className="mt-2 text-3xl font-bold text-foreground">{activeYears}</p></article>
      </section>

      <section className="rounded-panel border border-border bg-surface shadow-sm" aria-labelledby="class-list-title">
        <div className="border-b border-border p-5 sm:p-6">
          <h2 id="class-list-title" className="text-xl font-bold">Lista de turmas</h2>
          <p className="mt-1 text-sm text-muted">{filteredGroups.length} de {groups.length} turma(s) exibida(s).</p>
          <div className="mt-5 grid gap-3 md:grid-cols-[minmax(15rem,1fr)_12rem_12rem]">
            <label className="grid gap-2 text-sm font-semibold">Buscar turma
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: 3º Ano A" className="min-h-11 rounded-control border border-border bg-white px-3 py-2 font-normal" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">Ano letivo
              <select value={year} onChange={(event) => setYear(event.target.value)} className="min-h-11 rounded-control border border-border bg-white px-3 py-2 font-normal"><option value="all">Todos os anos</option>{academicYears.map((item) => <option key={item.id} value={item.year}>{item.year}</option>)}</select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">Situação
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-11 rounded-control border border-border bg-white px-3 py-2 font-normal"><option value="all">Todas</option><option value="ACTIVE">Ativas</option><option value="INACTIVE">Inativas</option></select>
            </label>
          </div>
        </div>

        {filteredGroups.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-3">Turma</th><th className="px-5 py-3">Série</th><th className="px-5 py-3">Ano letivo</th><th className="px-5 py-3">Situação</th><th className="px-5 py-3 text-right">Ações</th></tr></thead>
              <tbody>{filteredGroups.map((group) => (
                <tr key={group.id} className="border-t border-border transition hover:bg-blue-50/40">
                  <th className="px-5 py-4 text-base font-bold text-foreground">{group.name}</th>
                  <td className="px-5 py-4">{group.grade}º ano</td><td className="px-5 py-4">{group.academicYear.year}</td>
                  <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${group.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"}`}>{group.status === "ACTIVE" ? "Ativa" : "Inativa"}</span></td>
                  <td className="px-5 py-4"><div className="flex justify-end gap-2"><Link href={`/escola/turmas/${group.id}`} className="inline-flex min-h-11 items-center rounded-control border border-border px-3 font-semibold text-foreground transition hover:border-blue-200 hover:bg-blue-50 hover:text-brand">Abrir</Link><Modal trigger="Editar" title={`Editar ${group.name}`} description="A alteração é validada e registrada no histórico de auditoria." triggerVariant="secondary" triggerClassName="px-3"><EditClassGroupForm schoolId={schoolId} classGroup={group} academicYears={academicYears} /></Modal></div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <div className="p-10 text-center"><p className="font-bold">Nenhuma turma encontrada</p><p className="mt-1 text-sm text-muted">Ajuste os filtros ou cadastre uma nova turma.</p></div>}
      </section>
    </div>
  );
}
