"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatBRL } from "@/lib/format";

export type LinhaRanking = {
  id: string;
  nome: string;
  investimento: number;
  faturamento: number;
  vendas: number;
  roas: number | null;
  ticketMedio: number | null;
};

type SortKey = "nome" | "roas" | "faturamento" | "vendas" | "ticketMedio";

export function ResultadosRankingTable({ linhas }: { linhas: LinhaRanking[] }) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("roas");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "nome" ? "asc" : "desc");
    }
  }

  const ordenadas = useMemo(() => {
    const fator = sortDir === "asc" ? 1 : -1;
    return [...linhas].sort((a, b) => {
      if (sortKey === "nome") {
        return fator * a.nome.localeCompare(b.nome, "pt-BR");
      }
      const va =
        sortKey === "roas"
          ? a.roas ?? -Infinity
          : sortKey === "ticketMedio"
            ? a.ticketMedio ?? -Infinity
            : a[sortKey];
      const vb =
        sortKey === "roas"
          ? b.roas ?? -Infinity
          : sortKey === "ticketMedio"
            ? b.ticketMedio ?? -Infinity
            : b[sortKey];
      return fator * (va - vb);
    });
  }, [linhas, sortKey, sortDir]);

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="px-4 py-3 font-medium">#</th>
            <SortableHeader
              label="Grupo"
              sortKey="nome"
              current={sortKey}
              dir={sortDir}
              onSort={handleSort}
            />
            <SortableHeader
              label="ROAS"
              sortKey="roas"
              current={sortKey}
              dir={sortDir}
              onSort={handleSort}
            />
            <SortableHeader
              label="Faturamento"
              sortKey="faturamento"
              current={sortKey}
              dir={sortDir}
              onSort={handleSort}
            />
            <SortableHeader
              label="Vendas"
              sortKey="vendas"
              current={sortKey}
              dir={sortDir}
              onSort={handleSort}
            />
            <SortableHeader
              label="Ticket médio"
              sortKey="ticketMedio"
              current={sortKey}
              dir={sortDir}
              onSort={handleSort}
            />
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((l, i) => (
            <tr
              key={l.id}
              onClick={() => router.push(`/grupos/${l.id}/resultados`)}
              className="cursor-pointer border-b border-border last:border-0 hover:bg-bg-surface-hover"
            >
              <td className="px-4 py-3 tabular-nums text-text-secondary">{i + 1}</td>
              <td className="px-4 py-3 font-medium text-text-primary">{l.nome}</td>
              <td className="px-4 py-3 tabular-nums text-text-primary">
                {l.roas === null ? "—" : `${l.roas.toFixed(1)}x`}
              </td>
              <td className="px-4 py-3 tabular-nums text-status-ok-text">
                {formatBRL(l.faturamento)}
              </td>
              <td className="px-4 py-3 tabular-nums text-text-primary">{l.vendas}</td>
              <td className="px-4 py-3 tabular-nums text-text-primary">
                {l.ticketMedio === null ? "—" : formatBRL(l.ticketMedio)}
              </td>
              <td className="px-4 py-3 text-right text-text-secondary">→</td>
            </tr>
          ))}
          {ordenadas.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                Nenhum grupo ativo cadastrado ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
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
    <th className="px-4 py-3 font-medium">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSort(sortKey);
        }}
        className={`flex items-center gap-1 hover:text-text-primary ${
          active ? "text-text-primary" : ""
        }`}
      >
        {label}
        <span className="text-xs">{active ? (dir === "asc" ? "▲" : "▼") : ""}</span>
      </button>
    </th>
  );
}
