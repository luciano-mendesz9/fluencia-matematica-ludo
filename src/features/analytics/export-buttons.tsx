"use client";

import { useState } from "react";

function filenameFrom(header: string | null, fallback: string) {
  const match = header?.match(/filename="([a-zA-Z0-9._-]+)"/);
  return match?.[1] ?? fallback;
}

export function ExportButtons({ query }: { query: string }) {
  const [pending, setPending] = useState<"pdf" | "xlsx" | null>(null);
  const [error, setError] = useState("");

  async function download(format: "pdf" | "xlsx") {
    setPending(format);
    setError("");
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(`/api/relatorios/${format}${query ? `?${query}` : ""}`, { credentials: "same-origin", signal: controller.signal });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { message?: string; correlationId?: string } | null;
        throw new Error(`${body?.message ?? "Não foi possível gerar o arquivo."}${body?.correlationId ? ` Código: ${body.correlationId}.` : ""}`);
      }
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filenameFrom(response.headers.get("content-disposition"), `relatorio.${format}`);
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof DOMException && cause.name === "AbortError" ? "A geração demorou além do limite. Refine os filtros e tente novamente." : cause instanceof Error ? cause.message : "Não foi possível gerar o arquivo.");
    } finally {
      window.clearTimeout(timer);
      setPending(null);
    }
  }

  return <section className="rounded-panel border border-border bg-surface p-5" aria-labelledby="export-title">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 id="export-title" className="text-lg font-bold">Exportar este recorte</h2><p className="mt-1 text-sm text-muted">PDF e XLSX usam os mesmos filtros e definições exibidos no painel.</p></div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => download("pdf")} disabled={pending !== null} className="min-h-11 rounded-control border border-brand px-5 font-bold text-brand disabled:cursor-wait disabled:opacity-60">{pending === "pdf" ? "Aguarde…" : "Baixar PDF"}</button>
        <button type="button" onClick={() => download("xlsx")} disabled={pending !== null} className="min-h-11 rounded-control bg-brand px-5 font-bold text-white hover:bg-brand-hover disabled:cursor-wait disabled:opacity-60">{pending === "xlsx" ? "Aguarde…" : "Baixar XLSX"}</button>
      </div>
    </div>
    {error ? <p className="mt-4 rounded-control border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p> : null}
  </section>;
}
