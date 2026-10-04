"use client";

import Link from "next/link";
import { useState } from "react";

export type NavigationItem = {
  href: string;
  label: string;
};

export function MobileNavigation({ items }: { items: NavigationItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border bg-surface px-4 font-semibold text-foreground"
        aria-controls="mobile-navigation"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">☰</span>
        Menu
      </button>
      {open ? (
        <nav
          id="mobile-navigation"
          aria-label="Navegação principal"
          className="absolute inset-x-4 top-[4.75rem] z-40 rounded-panel border border-border bg-surface p-3 shadow-xl"
        >
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex min-h-11 items-center rounded-control px-4 font-semibold text-foreground hover:bg-blue-50 hover:text-brand"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
