"use client";

import { useState } from "react";
import { ResultadosRankingTable, type LinhaRanking } from "@/components/ResultadosRankingTable";
import { ResultadosPorMesTable, type LinhaMensal } from "@/components/ResultadosPorMesTable";

export function ResultadosTabs({
  linhasRanking,
  linhasMensal,
}: {
  linhasRanking: LinhaRanking[];
  linhasMensal: LinhaMensal[];
}) {
  const [aba, setAba] = useState<"grupo" | "mes">("grupo");

  return (
    <div>
      <div className="flex gap-2 border-b border-border">
        <TabButton label="Por grupo" ativo={aba === "grupo"} onClick={() => setAba("grupo")} />
        <TabButton label="Por mês" ativo={aba === "mes"} onClick={() => setAba("mes")} />
      </div>

      <div className="mt-6">
        {aba === "grupo" ? (
          <ResultadosRankingTable linhas={linhasRanking} />
        ) : (
          <ResultadosPorMesTable linhas={linhasMensal} />
        )}
      </div>
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
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
        ativo
          ? "border-accent text-text-primary"
          : "border-transparent text-text-secondary hover:text-text-primary"
      }`}
    >
      {label}
    </button>
  );
}
