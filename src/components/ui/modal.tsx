"use client";

import { useId, useRef, type ReactNode } from "react";
import { Button, type ButtonVariant } from "./button";

export function Modal({
  trigger,
  title,
  description,
  children,
  triggerVariant = "primary",
  triggerClassName = "",
  size = "md",
}: {
  trigger: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  triggerVariant?: ButtonVariant;
  triggerClassName?: string;
  size?: "md" | "lg";
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <>
      <Button variant={triggerVariant} className={triggerClassName} onClick={() => dialogRef.current?.showModal()}>
        {trigger}
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`m-auto max-h-[90dvh] w-[calc(100%-2rem)] overflow-hidden rounded-panel border border-border bg-surface p-0 text-left text-foreground shadow-2xl backdrop:bg-slate-950/55 ${size === "lg" ? "max-w-3xl" : "max-w-xl"}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="flex items-start justify-between gap-5 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 id={titleId} className="text-xl font-bold">{title}</h2>
            {description ? <p id={descriptionId} className="mt-1 text-sm text-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-muted transition hover:bg-blue-50 hover:text-brand"
            aria-label="Fechar janela"
          >
            ×
          </button>
        </div>
        <div className="max-h-[calc(90dvh-5rem)] overflow-y-auto p-5 sm:p-6">{children}</div>
      </dialog>
    </>
  );
}
