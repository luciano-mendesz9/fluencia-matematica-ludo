"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./button";

export function InfoDialog() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key !== "Tab") return;
      const dialog = closeRef.current?.closest<HTMLElement>("[role=dialog]");
      const focusable = dialog?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input:not([disabled])");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  return (
    <>
      <Button ref={triggerRef} onClick={() => setOpen(true)}>Conheça o projeto</Button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" onMouseDown={(event) => { if (event.currentTarget === event.target) close(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="project-dialog-title" className="w-full max-w-lg rounded-panel border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-6">
              <div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">Fluência Matemática</p><h2 id="project-dialog-title" className="mt-2 text-2xl font-bold">Prática com evidência pedagógica</h2></div>
              <button ref={closeRef} type="button" onClick={close} className="grid min-h-11 min-w-11 place-items-center rounded-control border border-border text-xl text-muted hover:text-foreground" aria-label="Fechar">×</button>
            </div>
            <p className="mt-5 leading-7 text-muted">O estudante pratica dentro de atividades propostas pelo professor. O jogo produz respostas, pontos e indicadores que permanecem separados e rastreáveis.</p>
          </section>
        </div>
      ) : null}
    </>
  );
}
