export function OperationsLoading() {
  return <main className="min-h-screen bg-background p-6" aria-busy="true"><div className="mx-auto max-w-5xl space-y-4"><div className="h-8 w-72 animate-pulse rounded bg-blue-100" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-panel border border-border bg-white" />)}</div><p className="text-muted">Carregando estado operacional…</p></div></main>;
}
