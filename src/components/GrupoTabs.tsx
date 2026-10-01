"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function GrupoTabs({ grupoId }: { grupoId: string }) {
  const pathname = usePathname();
  const base = `/grupos/${grupoId}`;

  const tabs = [
    { href: base, label: "Visão geral" },
    { href: `${base}/onboarding`, label: "Onboarding" },
    { href: `${base}/reunioes`, label: "Reuniões" },
    { href: `${base}/pagamentos`, label: "Pagamentos" },
    { href: `${base}/resultados`, label: "Resultados" },
    { href: `${base}/tarefas`, label: "Tarefas" },
    { href: `${base}/linha-do-tempo`, label: "Linha do tempo" },
  ];

  return (
    // prefetch=false: rotas dinâmicas (Supabase por request); com prefetch
    // ligado, clicar numa aba disparava RSC fetch para as 5 ao mesmo tempo
    // (mais o menu lateral), rajada que o Vercel às vezes limitava com 503,
    // fazendo a navegação por clique falhar de forma intermitente.
    <nav className="flex gap-7 overflow-x-auto overflow-y-hidden text-[14.5px] shadow-[inset_0_-1px_0_var(--line)]">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch={false}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 border-b-2 pb-3 transition-colors ${
              active ? "border-gold text-text" : "border-transparent text-muted hover:text-text"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
