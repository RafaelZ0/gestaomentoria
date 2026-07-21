"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";

const NAV_ITEMS = [
  { href: "/grupos", label: "Grupos de gestão" },
  { href: "/financas", label: "Finanças" },
  { href: "/tipos-entrega", label: "Tipos de entrega" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-bg-surface">
      <div className="px-5 py-6">
        <span className="font-display text-lg font-semibold text-text-primary">
          Gestão de Tráfego
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/grupos"
              ? pathname.startsWith("/grupos")
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg border-l-2 px-3 py-2 text-sm transition-colors ${
                active
                  ? "border-accent bg-bg-surface-hover text-text-primary font-medium"
                  : "border-transparent text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border px-3 py-4">
        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-bg-surface-hover hover:text-text-primary"
          >
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
