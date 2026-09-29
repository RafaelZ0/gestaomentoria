"use client";

import { useState } from "react";
import { ResultadosRankingTable, type LinhaRanking } from "@/components/ResultadosRankingTable";
import {
  ResultadosComparativoMensal,
  type MesComparativo,
} from "@/components/ResultadosComparativoMensal";

export function ResultadosTabs({
  linhasRanking,
  meses,
}: {
  linhasRanking: LinhaRanking[];
  meses: MesComparativo[];
}) {
  const [aba, setAba] = useState<"grupo" | "mes">("grupo");

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" className="flex gap-7 text-[14.5px] shadow-[inset_0_-1px_0_var(--line)]">
        <TabButton label="Por grupo" ativo={aba === "grupo"} onClick={() => setAba("grupo")} />
        <TabButton label="Por mês" ativo={aba === "mes"} onClick={() => setAba("mes")} />
      </div>

      {aba === "grupo" ? (
        <ResultadosRankingTable linhas={linhasRanking} />
      ) : (
        <ResultadosComparativoMensal meses={meses} />
      )}
    </div>
  );
}

function TabButton({
  label,
  ativo,
  onClick,
}: {
  label: string;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={ativo}
      onClick={onClick}
      className={`border-b-2 pb-3 transition-colors ${
        ativo ? "border-gold text-text" : "border-transparent text-muted hover:text-text"
      }`}
    >
      {label}
    </button>
  );
}
