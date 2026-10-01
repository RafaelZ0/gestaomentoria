"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { displayGroupName, formatBRL } from "@/lib/format";
import { Tendencia } from "@/components/ui/Tendencia";
import type { VariacoesMes } from "@/lib/tendencia";

export type LinhaRanking = {
  id: string;
  nome: string;
  temLancamento: boolean;
  investimento: number;
  faturamento: number;
  vendas: number;
  cpl: number | null;
  roas: number | null;
  ticketMedio: number | null;
  // Último mês com lançamento contra o anterior com lançamento.
  variacoes: VariacoesMes;
};

type SortKey = "nome" | "roas" | "cpl" | "faturamento" | "vendas" | "ticketMedio";

export function ResultadosRankingTable({ linhas }: { linhas: LinhaRanking[] }) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("roas");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "nome" || key === "cpl" ? "asc" : "desc");
    }
  }

  const ordenadas = useMemo(() => {
    const fator = sortDir === "asc" ? 1 : -1;
    const valor = (l: LinhaRanking): number => {
      if (sortKey === "roas") return l.roas ?? -Infinity;
      if (sortKey === "cpl") return l.cpl ?? Infinity;
      if (sortKey === "ticketMedio") return l.ticketMedio ?? -Infinity;
      return l[sortKey as "faturamento" | "vendas"];
    };
    const ordenar = (a: LinhaRanking, b: LinhaRanking) =>
      sortKey === "nome"
        ? fator * displayGroupName(a.nome).localeCompare(displayGroupName(b.nome), "pt-BR")
        : fator * (valor(a) - valor(b));
    // Grupos sem nenhum lançamento ficam sempre no fim, em qualquer ordenação.
    return [
      ...linhas.filter((l) => l.temLancamento).sort(ordenar),
      ...linhas
        .filter((l) => !l.temLancamento)
        .sort((a, b) => displayGroupName(a.nome).localeCompare(displayGroupName(b.nome), "pt-BR")),
    ];
  }, [linhas, sortKey, sortDir]);

  let posicao = 0;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-[14.5px]">
        <thead>
          <tr className="border-b border-line text-[13px] text-muted">
            <th className="px-3 pb-2.5 pt-3 font-normal">#</th>
            <SortableHeader label="Grupo" sortKey="nome" current={sortKey} dir={sortDir} onSort={handleSort} />
            <SortableHeader label="ROAS" sortKey="roas" current={sortKey} dir={sortDir} onSort={handleSort} />
            <SortableHeader label="CPL" sortKey="cpl" current={sortKey} dir={sortDir} onSort={handleSort} />
            <SortableHeader label="Faturamento" sortKey="faturamento" current={sortKey} dir={sortDir} onSort={handleSort} />
            <SortableHeader label="Vendas" sortKey="vendas" current={sortKey} dir={sortDir} onSort={handleSort} />
            <SortableHeader label="Ticket médio" sortKey="ticketMedio" current={sortKey} dir={sortDir} onSort={handleSort} />
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((l) => {
            if (l.temLancamento) posicao += 1;
            return (
              <tr
                key={l.id}
                onClick={() => router.push(`/grupos/${l.id}/resultados`)}
                className="cursor-pointer border-b border-line-soft transition-colors last:border-0 hover:bg-hover"
              >
                <td className="px-3 py-3 tabular-nums text-muted">{l.temLancamento ? posicao : ""}</td>
                <td className="px-3 py-3 text-text">{displayGroupName(l.nome)}</td>
                {l.temLancamento ? (
                  <>
                    <td className="px-3 py-3 tabular-nums text-text">
                      {l.roas === null ? "—" : `${l.roas.toFixed(1)}x`}
                      <Tendencia v={l.variacoes.roas} />
                    </td>
                    <td className="px-3 py-3 tabular-nums text-text">
                      {l.cpl === null ? "—" : formatBRL(l.cpl)}
                      <Tendencia v={l.variacoes.cpl} melhorQuandoMaior={false} />
                    </td>
                    <td className="px-3 py-3 tabular-nums text-text">
                      {formatBRL(l.faturamento)}
                      <Tendencia v={l.variacoes.faturamento} />
                    </td>
                    <td className="px-3 py-3 tabular-nums text-text">
                      {l.vendas}
                      <Tendencia v={l.variacoes.vendas} />
                    </td>
                    <td className="px-3 py-3 tabular-nums text-text">
                      {l.ticketMedio === null ? "—" : formatBRL(l.ticketMedio)}
                    </td>
                  </>
                ) : (
                  <td colSpan={5} className="px-3 py-3 text-[13.5px] text-subtle">
                    Sem lançamentos
                  </td>
                )}
              </tr>
            );
          })}
          {ordenadas.length === 0 && (
            <tr>
              <td colSpan={7} className="px-3 py-8 text-center text-muted">
                Nenhum grupo ativo cadastrado ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="mt-3 text-[13px] text-muted">
        Setas: variação do último mês com lançamento em relação ao anterior com lançamento.
      </p>
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th className="px-3 pb-2.5 pt-3 font-normal">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSort(sortKey);
        }}
        className={`flex items-center gap-1 hover:text-text ${active ? "text-text-2" : ""}`}
      >
        {label}
        <span className="text-[10px]">{active ? (dir === "asc" ? "▲" : "▼") : ""}</span>
      </button>
    </th>
  );
}
