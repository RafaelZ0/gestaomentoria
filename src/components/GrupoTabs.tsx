"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function GrupoTabs({ grupoId }: { grupoId: string }) {
  const pathname = usePathname();
  const base = `/grupos/${grupoId}`;

  const tabs = [
    { href: base, label: "Visão geral" },
    { href: `${base}/reunioes`, label: "Reuniões" },
    { href: `${base}/pagamentos`, label: "Pagamentos" },
    { href: `${base}/resultados`, label: "Resultados" },
    { href: `${base}/tarefas`, label: "Tarefas" },
  ];

  return (
    <div className="mt-6 flex gap-1 border-b border-border">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`border-b-2 px-4 py-2 text-sm transition-colors ${
              active
                ? "border-accent text-text-primary font-medium"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
