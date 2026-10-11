import Link from "next/link";
import { Feedback } from "@/src/components/ui/feedback";
import type { getTechnicalOperations } from "@/src/server/operations/service";

type Result = Awaited<ReturnType<typeof getTechnicalOperations>>;

function dateTime(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium", timeZone: "America/Fortaleza" }).format(value);
}

function pageHref(basePath: string, result: Result, page: number) {
  const query = new URLSearchParams();
  if (result.filters.correlationId) query.set("correlationId", result.filters.correlationId);
  if (result.filters.level) query.set("level", result.filters.level);
  if (result.filters.category) query.set("category", result.filters.category);
  query.set("page", String(page));
  return `${basePath}?${query.toString()}`;
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return <div className="adult-card p-5"><dt className="text-sm font-semibold text-muted">{label}</dt><dd className="mt-2 text-3xl font-extrabold tracking-tight">{value}</dd><p className="mt-1 text-sm leading-6 text-muted">{detail}</p></div>;
}

export function OperationsDashboard({ result, basePath }: { result: Result; basePath: string }) {
  return <div className="space-y-8">
    <header><p className="text-sm font-bold uppercase tracking-[0.12em] text-brand">Operação técnica</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Saúde e eventos técnicos</h1><p className="mt-3 max-w-3xl leading-7 text-muted">Visão operacional com dados estritamente técnicos. Respostas, nomes de alunos, credenciais e segredos não fazem parte deste painel.</p></header>

    <section aria-labelledby="technical-summary"><h2 id="technical-summary" className="mb-4 text-xl font-bold">Estado atual</h2><dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Banco de dados" value={result.health.database === "AVAILABLE" ? "Disponível" : "Indisponível"} detail={`Consulta técnica em ${result.health.databaseLatencyMs} ms.`} />
      <Metric label="Versão" value={result.releaseSha} detail="Identificador público e limitado da entrega." />
      <Metric label="Erros técnicos" value={result.counts.errorsLast24Hours} detail="Eventos ERROR nas últimas 24 horas." />
      <Metric label="Auditoria" value={result.counts.auditEventsLast24Hours} detail="Eventos imutáveis registrados nas últimas 24 horas." />
    </dl></section>

    <Feedback title="Retenção protegida" variant="info">{result.retention.message}</Feedback>

    <form action={basePath} className="rounded-panel border border-border bg-surface p-5" aria-label="Filtros dos eventos técnicos">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm font-semibold">Correlation ID<input name="correlationId" defaultValue={result.filters.correlationId ?? ""} placeholder="ID técnico exato" className="adult-field mt-2 font-mono text-sm" /></label>
        <label className="text-sm font-semibold">Nível<select name="level" defaultValue={result.filters.level ?? ""} className="adult-field mt-2"><option value="">Todos os níveis</option><option value="INFO">INFO</option><option value="WARN">WARN</option><option value="ERROR">ERROR</option></select></label>
        <label className="text-sm font-semibold">Categoria<select name="category" defaultValue={result.filters.category ?? ""} className="adult-field mt-2"><option value="">Todas as categorias</option>{result.categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
      </div>
      <div className="mt-5 flex flex-wrap gap-3"><button className="min-h-11 rounded-control bg-brand px-5 font-bold text-white hover:bg-brand-hover">Aplicar filtros</button><Link href={basePath} className="inline-flex min-h-11 items-center rounded-control border border-border px-5 font-bold text-brand">Limpar</Link></div>
    </form>

    <section aria-labelledby="logs-title"><div className="flex flex-wrap items-end justify-between gap-2"><div><h2 id="logs-title" className="text-xl font-bold">Eventos operacionais</h2><p className="mt-1 text-sm text-muted">{result.pagination.total} evento(s), com paginação e conteúdo sanitizado.</p></div><p className="font-mono text-xs text-muted">Consulta: {result.requestCorrelationId}</p></div>
      <div className="mt-4 overflow-x-auto rounded-panel border border-border bg-surface"><table className="min-w-full text-left text-sm"><thead className="bg-blue-50"><tr><th className="px-4 py-3">Momento</th><th className="px-4 py-3">Nível</th><th className="px-4 py-3">Categoria / código</th><th className="px-4 py-3">Mensagem</th><th className="px-4 py-3">Correlation ID</th></tr></thead><tbody>{result.logs.map((log) => <tr key={log.id} className="border-t border-border align-top"><td className="whitespace-nowrap px-4 py-3">{dateTime(log.occurredAt)}</td><td className="px-4 py-3 font-bold">{log.level}</td><td className="px-4 py-3"><span className="font-semibold">{log.category}</span><span className="block font-mono text-xs text-muted">{log.code}</span></td><td className="max-w-xl px-4 py-3"><span>{log.message}</span>{log.metadata && Object.keys(log.metadata).length ? <details className="mt-2"><summary className="cursor-pointer font-semibold text-brand">Metadados técnicos</summary><pre className="mt-2 max-w-xl overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(log.metadata, null, 2)}</pre></details> : null}</td><td className="px-4 py-3 font-mono text-xs">{log.correlationId}</td></tr>)}{result.logs.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">Nenhum evento técnico corresponde aos filtros.</td></tr> : null}</tbody></table></div>
      <nav aria-label="Paginação dos eventos" className="mt-4 flex items-center justify-between gap-4"><span className="text-sm text-muted">Página {result.pagination.page} de {result.pagination.totalPages}</span><div className="flex gap-2">{result.pagination.page > 1 ? <Link className="inline-flex min-h-11 items-center rounded-control border border-border px-4 font-bold text-brand" href={pageHref(basePath, result, result.pagination.page - 1)}>Anterior</Link> : null}{result.pagination.page < result.pagination.totalPages ? <Link className="inline-flex min-h-11 items-center rounded-control border border-border px-4 font-bold text-brand" href={pageHref(basePath, result, result.pagination.page + 1)}>Próxima</Link> : null}</div></nav>
    </section>

    {result.filters.correlationId ? <section aria-labelledby="audit-correlation-title"><h2 id="audit-correlation-title" className="text-xl font-bold">Auditoria vinculada ao correlation ID</h2><p className="mt-1 text-sm text-muted">Somente ação, tipo de alvo e identificadores técnicos são expostos.</p><div className="mt-4 overflow-x-auto rounded-panel border border-border bg-surface"><table className="min-w-full text-left text-sm"><thead className="bg-blue-50"><tr><th className="px-4 py-3">Momento</th><th className="px-4 py-3">Ação</th><th className="px-4 py-3">Tipo de alvo</th><th className="px-4 py-3">Correlation ID</th></tr></thead><tbody>{result.correlatedAudits.map((event) => <tr key={event.id} className="border-t border-border"><td className="whitespace-nowrap px-4 py-3">{dateTime(event.at)}</td><td className="px-4 py-3 font-semibold">{event.action}</td><td className="px-4 py-3">{event.targetType}</td><td className="px-4 py-3 font-mono text-xs">{event.correlationId}</td></tr>)}{result.correlatedAudits.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">Nenhum evento de auditoria vinculado.</td></tr> : null}</tbody></table></div></section> : null}
  </div>;
}
