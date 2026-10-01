"use client";

import { useEffect } from "react";

// Abre a janela de impressão do navegador (onde dá pra escolher "Salvar
// como PDF"). Abre sozinha uma vez quando a página carrega.
export function BotaoImprimir() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-[10px] bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80"
    >
      Imprimir / salvar PDF
    </button>
  );
}
