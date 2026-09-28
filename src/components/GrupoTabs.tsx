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
  ];

  return (
    // prefetch=false: rotas dinâmicas (Supabase por request); com prefetch
    // ligado, clicar numa aba disparava RSC fetch para as 5 ao mesmo tempo
    // (mais o menu lateral), rajada que o Vercel às vezes limitava com 503,
    // fazendo a navegação por clique falhar de forma intermitente.
    <div className="mt-6 flex gap-1 border-b border-line">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch={false}
            className={`border-b-2 px-4 py-2 text-sm transition-colors ${
              active
                ? "border-gold text-text font-medium"
                : "border-transparent text-text-2 hover:text-text"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
