"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "../ui/icon";

export type NavigationItem = { href: string; label: string; icon?: IconName };

function iconForItem(item: NavigationItem): IconName {
  if (item.icon) return item.icon;
  const label = item.label.toLocaleLowerCase("pt-BR");
  if (label.includes("visão") || label.includes("início")) return "grid";
  if (label.includes("escola")) return "building";
  if (label.includes("turma")) return "school";
  if (label.includes("aluno")) return "graduation-cap";
  if (label.includes("pessoa") || label.includes("professor")) return "people";
  if (label.includes("quest")) return "book";
  if (label.includes("atividad")) return "clipboard";
  if (label.includes("revis")) return "shield";
  if (label.includes("senha")) return "settings";
  return "grid";
}

function itemIsCurrent(pathname: string, href: string) {
  const roots = ["/admin", "/escola", "/professor", "/operacao", "/aluno"];
  if (roots.includes(href)) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationLinks({ items, onNavigate, adult = false }: { items: NavigationItem[]; onNavigate?: () => void; adult?: boolean }) {
  const pathname = usePathname();
  return <ul className="space-y-1">{items.map((item) => {
    const current = itemIsCurrent(pathname, item.href);
    return <li key={item.href}><Link href={item.href} aria-current={current ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-[0.7rem] px-3.5 py-2.5 text-sm font-semibold transition ${current ? "bg-blue-50 text-brand" : "text-muted hover:bg-[#f1f6fd] hover:text-foreground"}`} onClick={onNavigate}>{adult ? <Icon name={iconForItem(item)} className="size-[18px] shrink-0" /> : null}<span>{item.label}</span></Link></li>;
  })}</ul>;
}

export function DesktopNavigation({ items }: { items: NavigationItem[] }) {
  return <NavigationLinks items={items} adult />;
}

export function StudentMobileNavigation({ items }: { items: NavigationItem[] }) {
  const [open, setOpen] = useState(false);
  return <div className="lg:hidden">
    <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border bg-surface px-4 font-semibold text-foreground" aria-controls="mobile-navigation" aria-expanded={open} onClick={() => setOpen((current) => !current)}><span aria-hidden="true">☰</span>Menu</button>
    {open ? <nav id="mobile-navigation" aria-label="Navegação principal" className="absolute inset-x-4 top-[4.75rem] z-40 rounded-panel border border-border bg-surface p-3 shadow-xl"><ul className="space-y-1">{items.map((item) => <li key={item.href}><Link href={item.href} className="flex min-h-11 items-center rounded-control px-4 font-semibold text-foreground hover:bg-blue-50 hover:text-brand" onClick={() => setOpen(false)}>{item.label}</Link></li>)}</ul></nav> : null}
  </div>;
}

export function MobileNavigation({ items }: { items: NavigationItem[] }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      requestAnimationFrame(() => triggerRef.current?.focus());
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return <div className="lg:hidden">
    <button ref={triggerRef} type="button" className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border bg-surface px-3.5 font-semibold text-foreground shadow-sm" aria-controls="mobile-navigation" aria-expanded={open} onClick={() => setOpen(true)}><Icon name="menu" className="size-5" /><span className="sr-only sm:not-sr-only">Menu</span></button>
    {open ? <>
      <button type="button" className="fixed inset-0 z-40 min-h-0 w-full cursor-default bg-slate-950/45" aria-label="Fechar menu" onClick={() => setOpen(false)} />
      <nav id="mobile-navigation" aria-label="Navegação principal" className="fixed inset-y-0 left-0 z-50 w-[min(18rem,88vw)] overflow-y-auto border-r border-border bg-surface p-4 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-brand text-lg font-extrabold text-white" aria-hidden="true">∑</span><div><p className="font-bold leading-tight">Fluência Matemática</p><p className="text-xs text-muted">Navegação</p></div></div><button ref={closeRef} type="button" className="grid size-11 place-items-center rounded-control border border-border text-muted" aria-label="Fechar menu" onClick={() => setOpen(false)}><Icon name="x" /></button></div>
        <NavigationLinks items={items} onNavigate={() => setOpen(false)} adult />
      </nav>
    </> : null}
  </div>;
}
