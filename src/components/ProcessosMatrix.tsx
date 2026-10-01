"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge, trafegoPagoVariant } from "@/components/StatusBadge";
import { StatusDot, sentenceCase } from "@/components/ui/StatusDot";
import { Segmented } from "@/components/ui/Segmented";
import { displayGroupName, displayProcessName } from "@/lib/format";

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
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="rotulo mb-1.5">Processo</label>
          <select
            value={filtroProcesso}
            onChange={(e) => setFiltroProcesso(e.target.value)}
            className="campo h-9 w-auto pr-8 text-[13.5px]"
          >
            <option value="">Todos</option>
            <option value={TRAFEGO_PAGO_ID}>Tráfego pago</option>
            {processos.map((p) => (
              <option key={p.id} value={p.id}>
                {displayProcessName(p.nome)}
                {!p.ativo ? " (inativo)" : ""}
              </option>
            ))}
          </select>
        </div>

        {filtroProcesso === TRAFEGO_PAGO_ID ? (
          <div>
            <label className="rotulo mb-1.5">Status</label>
            <select
              value={filtroTrafego}
              onChange={(e) => setFiltroTrafego(e.target.value)}
              className="campo h-9 w-auto pr-8 text-[13.5px]"
            >
              {TRAFEGO_OPCOES.map((op) => (
                <option key={op} value={op}>
                  {sentenceCase(op)}
                </option>
              ))}
            </select>
          </div>
        ) : (
          filtroProcesso && (
            <div>
              <label className="rotulo mb-1.5">
                Condição
              </label>
              <select
                value={filtroCondicao}
                onChange={(e) =>
                  setFiltroCondicao(e.target.value as "fizeram" | "nao_fizeram")
                }
                className="campo h-9 w-auto pr-8 text-[13.5px]"
              >
                <option value="nao_fizeram">Não fizeram</option>
                <option value="fizeram">Fizeram</option>
              </select>
            </div>
          )
        )}

        <div>
          <span className="rotulo mb-1.5">Status do grupo</span>
          <Segmented
            rotulo="Status do grupo"
            valor={filtroStatus}
            onChange={setFiltroStatus}
            opcoes={[
              { valor: "Ativo", label: "Ativos" },
              { valor: "Inativo", label: "Inativos" },
              { valor: "todos", label: "Todos" },
            ]}
          />
        </div>

        <p className="ml-auto pb-2 text-[13px] text-muted">
          {gruposFiltrados.length} grupo{gruposFiltrados.length === 1 ? "" : "s"}
          {filtroProcesso === TRAFEGO_PAGO_ID && (
            <> com tráfego pago “{filtroTrafego}”</>
          )}
          {processoSelecionado && (
            <>
              {" "}
              {filtroCondicao === "fizeram" ? "fizeram" : "não fizeram"} “
              {displayProcessName(processoSelecionado.nome)}”
            </>
          )}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="border-b border-line text-[13px] text-muted">
              <th className="sticky left-0 z-10 bg-bg px-3 pb-2.5 pt-3 font-normal">
                Grupo
              </th>
              <th className="whitespace-nowrap px-3 pb-2.5 pt-3 text-center font-normal">
                Tráfego pago
              </th>
              {processos.map((p) => (
                <th
                  key={p.id}
                  className="whitespace-nowrap px-3 pb-2.5 pt-3 text-center font-normal"
                >
                  <div>{displayProcessName(p.nome)}</div>
                  <div className="mt-0.5 tabular-nums text-muted">
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
                className="group border-b border-line-soft last:border-0 hover:bg-hover"
              >
                <td className="sticky left-0 z-10 whitespace-nowrap bg-bg px-3 py-3 text-text group-hover:bg-hover">
                  <Link href={`/grupos/${g.id}`} prefetch={false} className="hover:text-gold">
                    {displayGroupName(g.nome)}
                  </Link>
                </td>
                <td className="px-3 py-3 text-center text-[13px]">
                  {g.trafego_pago ? (
                    <StatusBadge
                      label={g.trafego_pago}
                      variant={trafegoPagoVariant(g.trafego_pago)}
                    />
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                {processos.map((p) => {
                  const feito = feitoMap.get(`${g.id}:${p.id}`);
                  return (
                    <td key={p.id} className="px-3 py-3 text-center text-[13px]">
                      {feito === undefined ? (
                        <span className="text-muted">—</span>
                      ) : feito ? (
                        <StatusDot tom="ok">Feito</StatusDot>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-muted"><span className="h-[7px] w-[7px] rounded-full bg-danger" />Falta</span>
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
                  className="px-3 py-8 text-center text-muted"
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
