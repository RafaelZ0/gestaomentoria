"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { displayGroupName, formatBRL, formatDate } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { StatusDot, sentenceCase, tomStatusGrupo, tomTrafego } from "@/components/ui/StatusDot";
import type { GrupoGestao } from "@/lib/database.types";

type SortKey = "nome" | "trafego_pago" | "valor_mensal" | "data_inicio";
type SortDir = "asc" | "desc";
type FiltroStatus = "Ativo" | "Inativo" | "todos";

const TRAFEGO_ORDEM: Record<string, number> = {
  SIM: 0,
  "EM IMPLEMENTAÇÃO": 1,
  PARADO: 2,
  NÃO: 3,
};

const COLUNAS = "grid-cols-[2fr_1.4fr_1fr_1fr]";

export function GruposTable({ grupos }: { grupos: GrupoGestao[] }) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("Ativo");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const gruposFiltrados = useMemo(() => {
    const buscaNormalizada = busca.trim().toLowerCase();
    return grupos.filter((g) => {
      if (filtroStatus !== "todos" && g.status !== filtroStatus) return false;
      if (
        buscaNormalizada &&
        !g.nome.toLowerCase().includes(buscaNormalizada) &&
        !displayGroupName(g.nome).toLowerCase().includes(buscaNormalizada)
      ) {
        return false;
      }
      return true;
    });
  }, [grupos, filtroStatus, busca]);

  const gruposOrdenados = useMemo(() => {
    const fator = sortDir === "asc" ? 1 : -1;
    return [...gruposFiltrados].sort((a, b) => {
      switch (sortKey) {
        case "trafego_pago": {
          const ra = a.trafego_pago ? TRAFEGO_ORDEM[a.trafego_pago] ?? 99 : 99;
          const rb = b.trafego_pago ? TRAFEGO_ORDEM[b.trafego_pago] ?? 99 : 99;
          return fator * (ra - rb);
        }
        case "valor_mensal":
          return fator * (Number(a.valor_mensal) - Number(b.valor_mensal));
        case "data_inicio":
          return fator * a.data_inicio.localeCompare(b.data_inicio);
        case "nome":
          return fator * displayGroupName(a.nome).localeCompare(displayGroupName(b.nome), "pt-BR");
        default:
          return displayGroupName(a.nome).localeCompare(displayGroupName(b.nome), "pt-BR");
      }
    });
  }, [gruposFiltrados, sortKey, sortDir]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Segmented
            rotulo="Filtrar por status"
            valor={filtroStatus}
            onChange={setFiltroStatus}
            opcoes={[
              { valor: "Ativo", label: "Ativos" },
              { valor: "Inativo", label: "Inativos" },
              { valor: "todos", label: "Todos" },
            ]}
          />
          <span className="text-[13px] text-subtle">
            {gruposOrdenados.length} grupo{gruposOrdenados.length === 1 ? "" : "s"}
          </span>
        </div>
        <label className="flex h-9 w-full items-center gap-2 rounded-[10px] bg-surface px-3 text-subtle focus-within:ring-2 focus-within:ring-gold/40 sm:w-[280px]">
          <Icon nome="busca" tamanho={16} traco={1.8} />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar grupo"
            aria-label="Buscar grupo"
            className="w-full border-0 bg-transparent text-sm text-text shadow-none outline-none placeholder:text-subtle focus:shadow-none"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className={`grid ${COLUNAS} border-b border-line px-3 pb-2.5 pt-3 text-[12.5px] text-subtle`}>
            <CabecalhoOrdenavel label="Grupo" chave="nome" atual={sortKey} dir={sortDir} onSort={handleSort} />
            <CabecalhoOrdenavel label="Tráfego pago" chave="trafego_pago" atual={sortKey} dir={sortDir} onSort={handleSort} />
            <CabecalhoOrdenavel label="Valor mensal" chave="valor_mensal" atual={sortKey} dir={sortDir} onSort={handleSort} direita />
            <CabecalhoOrdenavel label="Início" chave="data_inicio" atual={sortKey} dir={sortDir} onSort={handleSort} direita />
          </div>

          {gruposOrdenados.map((g) => (
            <Link
              key={g.id}
              href={`/grupos/${g.id}`}
              prefetch={false}
              className={`grid ${COLUNAS} h-[50px] items-center border-b border-line-soft px-3 text-[14.5px] text-text transition-colors last:border-b-0 hover:bg-hover`}
            >
              <span className="flex min-w-0 items-center gap-2">
                {filtroStatus === "todos" && (
                  <span
                    title={g.status}
                    className={`h-[7px] w-[7px] shrink-0 rounded-full ${
                      tomStatusGrupo(g.status) === "ok" ? "bg-ok" : "bg-off"
                    }`}
                  />
                )}
                <span className="truncate">{displayGroupName(g.nome)}</span>
              </span>
              <span className="text-[13.5px]">
                {g.trafego_pago ? (
                  <StatusDot tom={tomTrafego(g.trafego_pago)}>{sentenceCase(g.trafego_pago)}</StatusDot>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </span>
              <span className="text-right tabular-nums">{formatBRL(Number(g.valor_mensal))}</span>
              <span className="text-right text-[13.5px] tabular-nums text-muted">
                {formatDate(g.data_inicio)}
              </span>
            </Link>
          ))}

          {gruposOrdenados.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted">
              {grupos.length === 0
                ? "Nenhum grupo cadastrado ainda."
                : "Nenhum grupo encontrado com esse filtro."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CabecalhoOrdenavel({
  label,
  chave,
  atual,
  dir,
  onSort,
  direita = false,
}: {
  label: string;
  chave: SortKey;
  atual: SortKey | null;
  dir: SortDir;
  onSort: (key: SortKey) => void;
  direita?: boolean;
}) {
  const ativo = atual === chave;
  return (
    <button
      type="button"
      onClick={() => onSort(chave)}
      className={`flex items-center gap-1 hover:text-text ${direita ? "justify-end" : ""} ${
        ativo ? "text-text-2" : ""
      }`}
    >
      {label}
      {ativo && <span className="text-[10px]">{dir === "asc" ? "▲" : "▼"}</span>}
    </button>
  );
}
