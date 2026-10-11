import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "../ui/icon";
import { DesktopNavigation, MobileNavigation, type NavigationItem } from "./mobile-navigation";
import { StudentNavigation } from "./student-navigation";

type AppShellProps = { areaLabel: string; currentUserLabel: string; navigation: NavigationItem[]; accountAction?: ReactNode; contextAction?: ReactNode; statusLabel?: string; children: ReactNode };

function StudentShell({ currentUserLabel, navigation, accountAction, contextAction, statusLabel = "Estrutura", children }: AppShellProps) {
  const avatar = initials(currentUserLabel) || "A";
  return <div className="student-shell min-h-screen bg-background">
    <header className="sticky top-0 z-30 border-b border-[#e2e9f3] bg-white/95 backdrop-blur"><div className="mx-auto flex min-h-[66px] max-w-6xl items-center gap-3 px-4"><Link href="/aluno" className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-xl font-black text-white" aria-label="Fluência Matemática — início">∑</Link><div className="min-w-0"><p className="truncate text-[15px] font-black leading-tight sm:text-lg">Fluência Matemática</p><p className="truncate text-xs text-muted">{currentUserLabel}{statusLabel !== "Estrutura" ? ` · ${statusLabel}` : ""}</p></div><span className="ml-auto grid size-11 place-items-center rounded-full bg-blue-50 text-sm font-black text-brand" aria-hidden="true">{avatar}</span>{accountAction}</div></header>
    <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[195px_minmax(0,1fr)] lg:gap-7 lg:px-5"><aside className="hidden py-8 lg:sticky lg:top-[66px] lg:block lg:h-fit"><StudentNavigation items={navigation} /></aside><main className="min-w-0 px-4 pb-24 pt-5 sm:px-6 lg:px-0 lg:pb-16 lg:pt-9">{contextAction}{children}</main></div>
    <StudentNavigation items={navigation} mobile />
  </div>;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase("pt-BR")).join("");
}

export function AppShell(props: AppShellProps) {
  if (props.areaLabel === "Aluno") return <StudentShell {...props} />;
  const { areaLabel, currentUserLabel, navigation, accountAction, contextAction, statusLabel = "Sessão ativa", children } = props;
  return <div className="adult-shell min-h-screen bg-background">
    <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur"><div className="mx-auto flex min-h-[68px] max-w-[1600px] items-center gap-3 px-4 sm:px-6"><MobileNavigation items={navigation} /><Link href={navigation[0]?.href ?? "/"} className="flex min-w-0 items-center gap-3" aria-label={`Fluência Matemática — ${areaLabel}`}><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-xl font-extrabold text-white shadow-sm" aria-hidden="true">∑</span><span className="min-w-0"><span className="block truncate font-bold leading-tight">Fluência Matemática</span><span className="block text-xs text-muted">Área de {areaLabel.toLocaleLowerCase("pt-BR")}</span></span></Link><div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3"><div className="hidden xl:block">{contextAction}</div><div className="hidden min-w-0 items-center gap-2 rounded-xl border border-border bg-surface px-2 py-1.5 sm:flex"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-extrabold text-brand" aria-hidden="true">{initials(currentUserLabel)}</span><span className="hidden max-w-40 truncate text-sm font-semibold md:block">{currentUserLabel}</span></div>{accountAction}</div></div></header>
    <div className="mx-auto flex max-w-[1600px]"><aside className="sticky top-[69px] hidden h-[calc(100vh-69px)] w-72 shrink-0 overflow-y-auto border-r border-border bg-surface p-5 lg:block"><div className="mb-5 flex items-center gap-2 px-3 text-xs font-bold uppercase tracking-[0.12em] text-muted"><Icon name="shield" className="size-4 text-brand" />{statusLabel}</div><nav aria-label="Navegação principal"><DesktopNavigation items={navigation} /></nav><div className="adult-card mt-8 p-4 text-sm"><p className="font-bold text-foreground">Contexto protegido</p><p className="mt-1 leading-6 text-muted">A sessão, o papel e os vínculos são confirmados pelo servidor.</p></div></aside>
      <main className="min-w-0 flex-1 px-4 py-7 sm:px-7 lg:px-10 lg:py-9">{contextAction ? <div className="mb-6 xl:hidden">{contextAction}</div> : null}<nav aria-label="Trilha de navegação" className="mb-6 text-sm text-muted"><ol className="flex flex-wrap items-center gap-2"><li><Link href={navigation[0]?.href ?? "/"} className="hover:text-brand">Visão geral</Link></li><li aria-hidden="true">/</li><li aria-current="page" className="font-semibold text-foreground">{areaLabel}</li></ol></nav>{children}</main>
    </div>
  </div>;
}
