"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Grupo = { id: string; nome: string; status: string };
type Processo = { id: string; nome: string; ativo: boolean };
type Entrega = { grupo_id: string; tipo_entrega_id: string; feito: boolean };

export function ProcessosMatrix({
  grupos,
  processos,
  entregas,
}: {
  grupos: Grupo[];
  processos: Processo[];
  entregas: Entrega[];
}) {
  const [filtroProcesso, setFiltroProcesso] = useState("");
  const [filtroCondicao, setFiltroCondicao] = useState<"fizeram" | "nao_fizeram">(
    "nao_fizeram"
  );
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "Ativo" | "Inativo">(
    "Ativo"
  );

  const feitoMap = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const e of entregas) {
      m.set(`${e.grupo_id}:${e.tipo_entrega_id}`, e.feito);
    }
    return m;
  }, [entregas]);

  const gruposFiltrados = useMemo(() => {
    return grupos.filter((g) => {
      if (filtroStatus !== "todos" && g.status !== filtroStatus) return false;
      if (filtroProcesso) {
        const feito = feitoMap.get(`${g.id}:${filtroProcesso}`);
        if (filtroCondicao === "fizeram" && feito !== true) return false;
        if (filtroCondicao === "nao_fizeram" && feito === true) return false;
      }
      return true;
    });
  }, [grupos, filtroStatus, filtroProcesso, filtroCondicao, feitoMap]);

  const processoSelecionado = processos.find((p) => p.id === filtroProcesso);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-text-secondary">Processo</label>
          <select
            value={filtroProcesso}
            onChange={(e) => setFiltroProcesso(e.target.value)}
            className="rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-sm text-text-primary"
          >
            <option value="">Todos</option>
            {processos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
                {!p.ativo ? " (inativo)" : ""}
              </option>
            ))}
          </select>
        </div>

        {filtroProcesso && (
          <div>
            <label className="mb-1 block text-xs text-text-secondary">Condição</label>
            <select
              value={filtroCondicao}
              onChange={(e) =>
                setFiltroCondicao(e.target.value as "fizeram" | "nao_fizeram")
              }
              className="rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-sm text-text-primary"
            >
              <option value="nao_fizeram">Não fizeram</option>
              <option value="fizeram">Fizeram</option>
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs text-text-secondary">
            Status do grupo
          </label>
          <select
            value={filtroStatus}
            onChange={(e) =>
              setFiltroStatus(e.target.value as "todos" | "Ativo" | "Inativo")
            }
            className="rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-sm text-text-primary"
          >
            <option value="Ativo">Ativos</option>
            <option value="Inativo">Inativos</option>
            <option value="todos">Todos</option>
          </select>
        </div>
      </div>

      <p className="text-sm text-text-secondary">
        {gruposFiltrados.length} grupo{gruposFiltrados.length === 1 ? "" : "s"}
        {processoSelecionado && (
          <>
            {" "}
            {filtroCondicao === "fizeram" ? "fizeram" : "não fizeram"} “
            {processoSelecionado.nome}”
          </>
        )}
      </p>

      <div className="overflow-x-auto rounded-xl border border-border bg-bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary">
              <th className="px-4 py-3 font-medium">Grupo</th>
              {processos.map((p) => (
                <th
                  key={p.id}
                  className="whitespace-nowrap px-4 py-3 text-center font-medium"
                >
                  {p.nome}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gruposFiltrados.map((g) => (
              <tr
                key={g.id}
                className="border-b border-border last:border-0 hover:bg-bg-surface-hover"
              >
                <td className="whitespace-nowrap px-4 py-3 font-medium text-text-primary">
                  <Link href={`/grupos/${g.id}`} className="hover:text-accent">
                    {g.nome}
                  </Link>
                </td>
                {processos.map((p) => {
                  const feito = feitoMap.get(`${g.id}:${p.id}`);
                  return (
                    <td key={p.id} className="px-4 py-3 text-center">
                      {feito === undefined ? (
                        <span className="text-text-secondary">—</span>
                      ) : feito ? (
                        <span className="text-status-ok-text">✓</span>
                      ) : (
                        <span className="text-status-alert-text">✗</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {gruposFiltrados.length === 0 && (
              <tr>
                <td
                  colSpan={processos.length + 1}
                  className="px-4 py-8 text-center text-text-secondary"
                >
                  Nenhum grupo encontrado com esse filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
