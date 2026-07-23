"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge, trafegoPagoVariant } from "@/components/StatusBadge";

type Grupo = {
  id: string;
  nome: string;
  status: string;
  trafego_pago: string | null;
};
type Processo = { id: string; nome: string; ativo: boolean };
type Entrega = { grupo_id: string; tipo_entrega_id: string; feito: boolean };

const TRAFEGO_PAGO_ID = "__trafego_pago__";
const TRAFEGO_OPCOES = ["SIM", "NÃO", "PARADO", "EM IMPLEMENTAÇÃO"];

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
  const [filtroTrafego, setFiltroTrafego] = useState("SIM");
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
      if (filtroProcesso === TRAFEGO_PAGO_ID) {
        return (g.trafego_pago ?? "") === filtroTrafego;
      }
      if (filtroProcesso) {
        const feito = feitoMap.get(`${g.id}:${filtroProcesso}`);
        if (filtroCondicao === "fizeram" && feito !== true) return false;
        if (filtroCondicao === "nao_fizeram" && feito === true) return false;
      }
      return true;
    });
  }, [grupos, filtroStatus, filtroProcesso, filtroCondicao, filtroTrafego, feitoMap]);

  const resumoPorProcesso = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of processos) {
      let feitos = 0;
      for (const g of gruposFiltrados) {
        if (feitoMap.get(`${g.id}:${p.id}`)) feitos += 1;
      }
      m.set(p.id, feitos);
    }
    return m;
  }, [processos, gruposFiltrados, feitoMap]);

  const processoSelecionado = processos.find((p) => p.id === filtroProcesso);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-bg-surface-hover p-3">
        <div>
          <label className="mb-1 block text-xs text-text-secondary">Processo</label>
          <select
            value={filtroProcesso}
            onChange={(e) => setFiltroProcesso(e.target.value)}
            className="rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary"
          >
            <option value="">Todos</option>
            <option value={TRAFEGO_PAGO_ID}>TRÁFEGO PAGO</option>
            {processos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
                {!p.ativo ? " (inativo)" : ""}
              </option>
            ))}
          </select>
        </div>

        {filtroProcesso === TRAFEGO_PAGO_ID ? (
          <div>
            <label className="mb-1 block text-xs text-text-secondary">Status</label>
            <select
              value={filtroTrafego}
              onChange={(e) => setFiltroTrafego(e.target.value)}
              className="rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary"
            >
              {TRAFEGO_OPCOES.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>
        ) : (
          filtroProcesso && (
            <div>
              <label className="mb-1 block text-xs text-text-secondary">
                Condição
              </label>
              <select
                value={filtroCondicao}
                onChange={(e) =>
                  setFiltroCondicao(e.target.value as "fizeram" | "nao_fizeram")
                }
                className="rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary"
              >
                <option value="nao_fizeram">Não fizeram</option>
                <option value="fizeram">Fizeram</option>
              </select>
            </div>
          )
        )}

        <div className="border-l border-border pl-4">
          <label className="mb-1 block text-xs text-text-secondary">
            Status do grupo
          </label>
          <select
            value={filtroStatus}
            onChange={(e) =>
              setFiltroStatus(e.target.value as "todos" | "Ativo" | "Inativo")
            }
            className="rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary"
          >
            <option value="Ativo">Ativos</option>
            <option value="Inativo">Inativos</option>
            <option value="todos">Todos</option>
          </select>
        </div>

        <p className="ml-auto text-sm text-text-secondary">
          {gruposFiltrados.length} grupo{gruposFiltrados.length === 1 ? "" : "s"}
          {filtroProcesso === TRAFEGO_PAGO_ID && (
            <> com tráfego pago “{filtroTrafego}”</>
          )}
          {processoSelecionado && (
            <>
              {" "}
              {filtroCondicao === "fizeram" ? "fizeram" : "não fizeram"} “
              {processoSelecionado.nome}”
            </>
          )}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary">
              <th className="sticky left-0 z-10 bg-bg-surface px-4 py-3 font-medium">
                Grupo
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-center font-medium">
                Tráfego pago
              </th>
              {processos.map((p) => (
                <th
                  key={p.id}
                  className="whitespace-nowrap px-4 py-3 text-center font-medium"
                >
                  <div>{p.nome}</div>
                  <div className="mt-0.5 font-normal tabular-nums text-text-secondary">
                    {resumoPorProcesso.get(p.id) ?? 0}/{gruposFiltrados.length}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gruposFiltrados.map((g) => (
              <tr
                key={g.id}
                className="group border-b border-border last:border-0 hover:bg-bg-surface-hover"
              >
                <td className="sticky left-0 z-10 whitespace-nowrap bg-bg-surface px-4 py-3 font-medium text-text-primary group-hover:bg-bg-surface-hover">
                  <Link href={`/grupos/${g.id}`} prefetch={false} className="hover:text-accent">
                    {g.nome}
                  </Link>
                </td>
                <td className="px-4 py-3 text-center">
                  {g.trafego_pago ? (
                    <StatusBadge
                      label={g.trafego_pago}
                      variant={trafegoPagoVariant(g.trafego_pago)}
                    />
                  ) : (
                    <span className="text-text-secondary">—</span>
                  )}
                </td>
                {processos.map((p) => {
                  const feito = feitoMap.get(`${g.id}:${p.id}`);
                  return (
                    <td key={p.id} className="px-4 py-3 text-center">
                      {feito === undefined ? (
                        <span className="text-text-secondary">—</span>
                      ) : feito ? (
                        <StatusBadge label="Feito" variant="ok" />
                      ) : (
                        <StatusBadge label="Falta" variant="alert" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {gruposFiltrados.length === 0 && (
              <tr>
                <td
                  colSpan={processos.length + 2}
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
