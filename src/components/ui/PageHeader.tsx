"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

// Título de página em Source Serif + "?" que abre o texto explicativo num
// popover (o texto não some, só sai do topo) + ações à direita.
export function PageHeader({
  titulo,
  ajuda,
  acoes,
  children,
}: {
  titulo: React.ReactNode;
  ajuda?: React.ReactNode;
  acoes?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-[32px] font-medium leading-tight tracking-[-0.015em] text-text min-[900px]:text-[36px]">
            {titulo}
          </h1>
          {ajuda && <AjudaPopover>{ajuda}</AjudaPopover>}
        </div>
        {children}
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </div>
  );
}

export function AjudaPopover({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function fora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", fora);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", fora);
      window.removeEventListener("keydown", onKey);
    };
  }, [aberto]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
        aria-label="Sobre esta página"
        className="flex h-7 w-7 items-center justify-center rounded-full text-subtle hover:bg-hover hover:text-text"
      >
        <Icon nome="ajuda" tamanho={17} />
      </button>
      {aberto && (
        <div
          role="dialog"
          className="absolute left-0 top-full z-40 mt-2 w-[min(420px,calc(100vw-2.5rem))] space-y-2 rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed text-text-2 shadow-2xl"
        >
          {children}
        </div>
      )}
    </div>
  );
}
