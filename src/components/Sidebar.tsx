"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";

const NAV_ITEMS = [
  { href: "/grupos", label: "Grupos de gestão" },
  { href: "/financas", label: "Finanças" },
  { href: "/resultados", label: "Resultados" },
  { href: "/tipos-entrega", label: "Processos" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="flex items-center justify-between border-b border-border bg-bg-surface px-4 py-3 md:hidden">
        <span className="font-display text-base font-semibold text-text-primary">
          Gestão de Tráfego
        </span>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="btn-secondary px-2.5 py-1.5"
        >
          ☰
        </button>
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-border bg-bg-surface transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-6">
          <span className="font-display text-lg font-semibold text-text-primary">
            Gestão de Tráfego
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="text-text-secondary hover:text-text-primary md:hidden"
          >
            ✕
          </button>
        </div>
        {/* prefetch=false: todas as rotas são dinâmicas (Supabase por
            request); com prefetch ligado, o Next dispara uma rajada de
            requisições RSC simultâneas (um fetch por link visível) que
            estava sendo limitada pelo Vercel com 503, deixando a navegação
            por clique intermitente. */}
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
                prefetch={false}
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
    </>
  );
}
