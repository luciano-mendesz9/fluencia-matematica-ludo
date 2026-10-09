import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { CreateQuestionForm, TaxonomyForms } from "@/src/features/questions/question-forms";
import { questionFiltersSchema } from "@/src/features/questions/schemas";
import { getCurrentSession } from "@/src/server/auth/session";
import { listEligibleQuestions, listTaxonomy } from "@/src/server/questions/service";

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  const actor = { id: session.user.id, name: session.user.name, globalRole: session.user.globalRole, studentCode: session.user.studentCode };
  const filters = questionFiltersSchema.parse(await searchParams);
  const [taxonomy, questions] = await Promise.all([listTaxonomy(actor), listEligibleQuestions({ actor, ...filters })]);
  const admin = session.user.globalRole === "SEMED_ADMIN";
  const navigation = admin ? [{ href: "/admin", label: "Visão geral" }, { href: "/questoes", label: "Banco de questões" }] : [{ href: "/professor", label: "Visão geral" }, { href: "/professor/turmas", label: "Minhas turmas" }, { href: "/questoes", label: "Banco de questões" }];
  return <AppShell areaLabel={admin ? "Administração" : "Professor"} currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel={admin ? "SEMED" : "Banco combinado"}>
    <div className="grid gap-8">
      <header><h1 className="text-3xl font-bold">Banco de questões</h1><p className="mt-2 text-muted">Questões da rede e questões privadas próprias, sem expor conteúdo privado de outros autores.</p></header>
      {admin && <section className="rounded-panel border border-border bg-surface p-5 sm:p-6" aria-labelledby="taxonomy-title"><h2 id="taxonomy-title" className="mb-5 text-2xl font-bold">Temas e habilidades da rede</h2><TaxonomyForms taxonomy={taxonomy}/></section>}
      <section className="grid gap-5 rounded-panel border border-border bg-surface p-5 sm:p-6" aria-labelledby="new-question-title"><h2 id="new-question-title" className="text-2xl font-bold">Nova questão {admin ? "da rede" : "privada"}</h2><CreateQuestionForm taxonomy={taxonomy}/></section>
      <section aria-labelledby="questions-title"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 id="questions-title" className="text-2xl font-bold">Questões disponíveis</h2><p className="mt-1 text-sm text-muted">Os filtros permanecem na URL para retorno e compartilhamento da visão.</p></div><form className="flex flex-wrap items-end gap-3" method="get"><label className="grid gap-1 text-sm font-semibold">Série<select name="grade" defaultValue={filters.grade ?? ""} className="min-h-11 rounded-control border border-border bg-surface px-3"><option value="">Todas</option>{[1,2,3,4,5].map((v)=><option key={v} value={v}>{v}º</option>)}</select></label><label className="grid gap-1 text-sm font-semibold">Dificuldade<select name="difficulty" defaultValue={filters.difficulty ?? ""} className="min-h-11 rounded-control border border-border bg-surface px-3"><option value="">Todas</option>{[1,2,3,4,5,6].map((v)=><option key={v} value={v}>{v}</option>)}</select></label><label className="grid gap-1 text-sm font-semibold">Origem<select name="origin" defaultValue={filters.origin ?? ""} className="min-h-11 rounded-control border border-border bg-surface px-3"><option value="">Todas</option><option value="SEMED">Rede</option><option value="PRIVATE">Privada</option></select></label><label className="grid gap-1 text-sm font-semibold">Situação<select name="status" defaultValue={filters.status ?? "ACTIVE"} className="min-h-11 rounded-control border border-border bg-surface px-3"><option value="ACTIVE">Ativas</option><option value="ARCHIVED">Arquivadas</option></select></label><button className="min-h-11 rounded-control bg-brand px-4 font-semibold text-white hover:bg-brand-hover">Filtrar</button></form></div>
        {questions.length === 0 ? <p className="mt-5 rounded-panel border border-border bg-surface p-5 text-muted">Nenhuma questão encontrada para estes filtros.</p> : <ul className="mt-5 grid gap-4 md:grid-cols-2">{questions.map((question) => { const version = question.versions[0]!; return <li key={question.id} className="rounded-panel border border-border bg-surface p-5"><div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide text-brand"><span>{question.origin === "SEMED" ? "Rede" : "Privada"}</span><span>{question.status === "ACTIVE" ? "Ativa" : "Arquivada"}</span><span>{version.grade}º ano</span><span>Dificuldade {version.difficulty}</span></div><h3 className="mt-3 font-bold">{version.theme.name}{version.skill ? ` · ${version.skill.name}` : ""}</h3><p className="mt-2 line-clamp-3 text-sm text-muted">{version.statement}</p><Link href={`/questoes/${question.id}`} className="mt-4 inline-flex min-h-11 items-center rounded-control border border-brand px-4 font-semibold text-brand hover:bg-blue-50">Ver histórico</Link></li>;})}</ul>}
      </section>
    </div>
  </AppShell>;
}
