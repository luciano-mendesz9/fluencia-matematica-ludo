import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "../ui/badge";
import { MobileNavigation, type NavigationItem } from "./mobile-navigation";

type AppShellProps = {
  areaLabel: string;
  currentUserLabel: string;
  navigation: NavigationItem[];
  accountAction?: ReactNode;
  statusLabel?: string;
  children: ReactNode;
};

export function AppShell({ areaLabel, currentUserLabel, navigation, accountAction, statusLabel = "Estrutura", children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="relative border-b border-border bg-surface">
        <div className="mx-auto flex min-h-16 max-w-screen-2xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="shrink-0 font-bold tracking-tight text-foreground">
              Fluência <span className="text-brand">Matemática</span>
            </Link>
            <span className="hidden min-[360px]:inline-flex"><Badge variant="info">{areaLabel}</Badge></span>
          </div>
          <div className="hidden items-center gap-3 text-sm text-muted sm:flex">
            <span>{currentUserLabel}</span>
            <Badge>{statusLabel}</Badge>
            {accountAction}
          </div>
          <MobileNavigation items={navigation} />
        </div>
      </header>

      <div className="mx-auto grid max-w-screen-2xl lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-4rem)] border-r border-border bg-surface p-4 lg:block">
          <nav aria-label="Navegação principal">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="flex min-h-11 items-center rounded-control bg-blue-50 px-4 font-semibold text-brand">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="min-w-0 px-4 py-8 sm:px-6 lg:px-8">
          {accountAction ? <div className="mb-5 flex items-center justify-between gap-3 sm:hidden"><span className="truncate text-sm text-muted">{currentUserLabel}</span>{accountAction}</div> : null}
          <nav aria-label="Trilha de navegação" className="mb-6 text-sm text-muted">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="hover:text-brand">Início</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="font-semibold text-foreground">{areaLabel}</li>
            </ol>
          </nav>
          {children}
        </main>
      </div>
    </div>
  );
}
