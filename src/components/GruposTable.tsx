"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatBRL, formatDate } from "@/lib/format";
import {
  StatusBadge,
  statusGrupoVariant,
  trafegoPagoVariant,
} from "@/components/StatusBadge";
import type { GrupoGestao } from "@/lib/database.types";

type SortKey = "nome" | "status" | "trafego_pago" | "valor_mensal" | "data_inicio";
type SortDir = "asc" | "desc";

const TRAFEGO_ORDEM: Record<string, number> = {
  SIM: 0,
  "EM IMPLEMENTAÇÃO": 1,
  PARADO: 2,
  NÃO: 3,
};

export function GruposTable({ grupos }: { grupos: GrupoGestao[] }) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const gruposOrdenados = useMemo(() => {
    if (!sortKey) return grupos;

    const fator = sortDir === "asc" ? 1 : -1;

    return [...grupos].sort((a, b) => {
      switch (sortKey) {
        case "nome":
          return fator * a.nome.localeCompare(b.nome, "pt-BR");
        case "status":
          return fator * a.status.localeCompare(b.status, "pt-BR");
        case "trafego_pago": {
          const ra = a.trafego_pago ? TRAFEGO_ORDEM[a.trafego_pago] ?? 99 : 99;
          const rb = b.trafego_pago ? TRAFEGO_ORDEM[b.trafego_pago] ?? 99 : 99;
          return fator * (ra - rb);
        }
        case "valor_mensal":
          return fator * (Number(a.valor_mensal) - Number(b.valor_mensal));
        case "data_inicio":
          return fator * a.data_inicio.localeCompare(b.data_inicio);
        default:
          return 0;
      }
    });
  }, [grupos, sortKey, sortDir]);

  return (
    <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <SortableHeader label="Nome" sortKey="nome" current={sortKey} dir={sortDir} onSort={handleSort} />
            <SortableHeader label="Status" sortKey="status" current={sortKey} dir={sortDir} onSort={handleSort} />
            <SortableHeader
              label="Tráfego pago"
              sortKey="trafego_pago"
              current={sortKey}
              dir={sortDir}
              onSort={handleSort}
            />
            <SortableHeader
              label="Valor mensal"
              sortKey="valor_mensal"
              current={sortKey}
              dir={sortDir}
              onSort={handleSort}
            />
            <SortableHeader label="Início" sortKey="data_inicio" current={sortKey} dir={sortDir} onSort={handleSort} />
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {gruposOrdenados.map((g) => (
            <tr
              key={g.id}
              onClick={() => router.push(`/grupos/${g.id}`)}
              className="cursor-pointer border-b border-border last:border-0 hover:bg-bg-surface-hover"
            >
              <td className="px-4 py-3 font-medium text-text-primary">{g.nome}</td>
              <td className="px-4 py-3">
                <StatusBadge label={g.status} variant={statusGrupoVariant(g.status)} />
              </td>
              <td className="px-4 py-3">
                {g.trafego_pago ? (
                  <StatusBadge
                    label={g.trafego_pago}
                    variant={trafegoPagoVariant(g.trafego_pago)}
                  />
                ) : (
                  <span className="text-text-secondary">—</span>
                )}
              </td>
              <td className="px-4 py-3 tabular-nums text-text-primary">
                {formatBRL(Number(g.valor_mensal))}
              </td>
              <td className="px-4 py-3 tabular-nums text-text-secondary">
                {formatDate(g.data_inicio)}
              </td>
              <td className="px-4 py-3 text-right text-text-secondary">→</td>
            </tr>
          ))}
          {gruposOrdenados.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                Nenhum grupo cadastrado ainda.
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
  current: SortKey | null;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th className="px-4 py-3 font-medium">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-1 hover:text-text-primary ${
          active ? "text-text-primary" : ""
        }`}
      >
        {label}
        <span className="text-xs">
          {active ? (dir === "asc" ? "▲" : "▼") : ""}
        </span>
      </button>
    </th>
  );
}
