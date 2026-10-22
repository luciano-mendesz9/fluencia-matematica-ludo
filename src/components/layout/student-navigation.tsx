"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "../ui/icon";
import type { NavigationItem } from "./mobile-navigation";

function current(pathname: string, href: string) {
  if (href === "/aluno") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function studentIcon(item: NavigationItem): IconName {
  if (item.href === "/aluno") return "home";
  if (item.href === "/aluno/jogos") return "grid";
  if (item.href === "/aluno/ranking") return "star";
  if (item.href === "/aluno/conquistas") return "sparkles";
  if (item.href === "/aluno/perfil") return "user";
  return "clipboard";
}

export function StudentNavigation({ items, mobile = false }: { items: NavigationItem[]; mobile?: boolean }) {
  const pathname = usePathname();
  if (mobile) return <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 px-1 pb-[max(5px,env(safe-area-inset-bottom))] backdrop-blur lg:hidden"><ul className="mx-auto flex max-w-md justify-around">{items.map((item) => { const active = current(pathname, item.href); return <li key={item.href} className="min-w-0 flex-1"><Link href={item.href} aria-current={active ? "page" : undefined} className={`relative flex min-h-[64px] min-w-0 flex-col items-center justify-center gap-1 text-xs font-extrabold ${active ? "text-brand" : "text-muted"}`}>{active ? <span className="absolute top-0 h-[3px] w-9 rounded-b-full bg-brand" /> : null}<Icon name={studentIcon(item)} className="size-5" /><span className="max-w-full truncate">{item.label}</span></Link></li>; })}</ul></nav>;
  return <nav aria-label="Navegação principal" className="student-card p-3"><ul className="space-y-1">{items.map((item) => { const active = current(pathname, item.href); return <li key={item.href}><Link href={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5 font-extrabold transition ${active ? "bg-blue-50 text-brand" : "text-muted hover:bg-slate-50 hover:text-foreground"}`}><Icon name={studentIcon(item)} className="size-[19px]" />{item.label}</Link></li>; })}</ul></nav>;
}
