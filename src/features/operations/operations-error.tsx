"use client";

export function OperationsError({ reset }: { reset: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-background p-6"><div className="adult-card max-w-lg p-7 text-center"><p className="text-sm font-bold uppercase tracking-[0.12em] text-danger">Consulta indisponível</p><h1 className="mt-2 text-2xl font-bold">Não foi possível carregar a operação técnica</h1><p className="mt-3 leading-7 text-muted">Nenhum detalhe interno foi exposto. Tente novamente; se persistir, use o correlation ID do evento registrado no servidor.</p><button onClick={reset} className="mt-5 min-h-11 rounded-control bg-brand px-5 font-bold text-white">Tentar novamente</button></div></main>;
}
