"use client";

import { useState } from "react";
import { formatMesAno } from "@/lib/format";

// Escolhe o mês e abre o relatório numa aba nova (lá a impressão do
// navegador permite "Salvar como PDF").
export function GerarRelatorio({ grupoId, meses }: { grupoId: string; meses: string[] }) {
  const [mes, setMes] = useState(meses[0] ?? "");

  if (meses.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={mes}
        onChange={(e) => setMes(e.target.value)}
        aria-label="Mês do relatório"
        className="campo h-9 w-auto pr-8 text-[13.5px]"
      >
        {meses.map((m) => (
          <option key={m} value={m}>
            {formatMesAno(Number(m.slice(0, 4)), Number(m.slice(5, 7)))}
          </option>
        ))}
      </select>
      <a
        href={`/relatorio/${grupoId}?mes=${mes}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary h-9"
      >
        Gerar relatório do mês
      </a>
    </div>
  );
}
