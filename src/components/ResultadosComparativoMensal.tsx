"use client";

import { Fragment, useState } from "react";
import { displayGroupName, formatBRL, formatMesAno } from "@/lib/format";
import { Tendencia } from "@/components/ui/Tendencia";
import { cplDe, roasDe, type VariacoesMes } from "@/lib/tendencia";

export type LinhaClinicaMes = {
  id: string;
  nome: string;
  investimento: number;
  leads: number;
  vendas: number;
  faturamento: number;
  cpl: number | null;
  roas: number | null;
  ticketMedio: number | null;
  // Em relação ao último mês anterior em que ESSA clínica teve lançamento.
  variacoes: VariacoesMes;
};

export type MesComparativo = {
  mes: string;
  clinicas: LinhaClinicaMes[];
  // Total do mês em relação ao mês anterior com lançamento.
  variacoes: VariacoesMes;
};

function somar(clinicas: LinhaClinicaMes[]) {
  return clinicas.reduce(
    (acc, c) => ({
      investimento: acc.investimento + c.investimento,
      leads: acc.leads + c.leads,
      vendas: acc.vendas + c.vendas,
      faturamento: acc.faturamento + c.faturamento,
    }),
    { investimento: 0, leads: 0, vendas: 0, faturamento: 0 }
  );
}

const TH = "px-3 pb-2.5 pt-3 font-normal";
const TD = "px-3 py-3 tabular-nums text-text";

export function ResultadosComparativoMensal({ meses }: { meses: MesComparativo[] }) {
  const [expandido, setExpandido] = useState<string | null>(meses[0]?.mes ?? null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-[14.5px]">
        <thead>
          <tr className="border-b border-line text-[13px] text-muted">
            <th className={TH}>Mês</th>
            <th className={TH}>Investido</th>
            <th className={TH}>CPL</th>
            <th className={TH}>ROAS</th>
            <th className={TH}>Vendas</th>
            <th className={TH}>Faturamento</th>
            <th className="px-3 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {meses.map(({ mes, clinicas, variacoes }) => {
            const [ano, mesNum] = mes.split("-").map(Number);
            const s = somar(clinicas);
            const cpl = cplDe(s);
            const roas = roasDe(s);
            const aberto = expandido === mes;
            const clinicasOrdenadas = [...clinicas].sort((a, b) => b.faturamento - a.faturamento);

            return (
              <Fragment key={mes}>
                <tr
                  className={`cursor-pointer border-b border-line-soft transition-colors last:border-0 hover:bg-hover ${aberto ? "bg-hover" : ""}`}
                  onClick={() => setExpandido(aberto ? null : mes)}
                  aria-expanded={aberto}
                >
                  <td className="px-3 py-3 text-text">{formatMesAno(ano, mesNum)}</td>
                  <td className={TD}>{formatBRL(s.investimento)}</td>
                  <td className={TD}>
                    {cpl === null ? "—" : formatBRL(cpl)}
                    <Tendencia v={variacoes.cpl} melhorQuandoMaior={false} />
                  </td>
                  <td className={TD}>
                    {roas === null ? "—" : `${roas.toFixed(1)}x`}
                    <Tendencia v={variacoes.roas} />
                  </td>
                  <td className={TD}>
                    {s.vendas}
                    <Tendencia v={variacoes.vendas} />
                  </td>
                  <td className={TD}>
                    {formatBRL(s.faturamento)}
                    <Tendencia v={variacoes.faturamento} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={`inline-block text-subtle transition-transform ${aberto ? "rotate-180" : ""}`}>
                      ▾
                    </span>
                  </td>
                </tr>
                {aberto && (
                  <tr className="border-b border-line-soft last:border-0">
                    <td colSpan={7} className="p-0 pb-4 pl-4">
                      <table className="w-full text-left text-[14.5px]">
                        <thead>
                          <tr className="border-b border-line text-[13px] text-muted">
                            <th className="px-3 py-2 font-normal">Clínica</th>
                            <th className="px-3 py-2 font-normal">Investido</th>
                            <th className="px-3 py-2 font-normal">Leads</th>
                            <th className="px-3 py-2 font-normal">CPL</th>
                            <th className="px-3 py-2 font-normal">Vendas</th>
                            <th className="px-3 py-2 font-normal">Faturamento</th>
                            <th className="px-3 py-2 font-normal">ROAS</th>
                            <th className="px-3 py-2 font-normal">Ticket médio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clinicasOrdenadas.map((c) => (
                            <tr key={c.id} className="border-b border-line-soft last:border-0">
                              <td className="px-3 py-2.5 text-text">{displayGroupName(c.nome)}</td>
                              <td className="px-3 py-2.5 tabular-nums text-text">{formatBRL(c.investimento)}</td>
                              <td className="px-3 py-2.5 tabular-nums text-text">{c.leads}</td>
                              <td className="px-3 py-2.5 tabular-nums text-text">
                                {c.cpl === null ? "—" : formatBRL(c.cpl)}
                                <Tendencia v={c.variacoes.cpl} melhorQuandoMaior={false} />
                              </td>
                              <td className="px-3 py-2.5 tabular-nums text-text">
                                {c.vendas}
                                <Tendencia v={c.variacoes.vendas} />
                              </td>
                              <td className="px-3 py-2.5 tabular-nums text-text">
                                {formatBRL(c.faturamento)}
                                <Tendencia v={c.variacoes.faturamento} />
                              </td>
                              <td className="px-3 py-2.5 tabular-nums text-text">
                                {c.roas === null ? "—" : `${c.roas.toFixed(1)}x`}
                                <Tendencia v={c.variacoes.roas} />
                              </td>
                              <td className="px-3 py-2.5 tabular-nums text-text">
                                {c.ticketMedio === null ? "—" : formatBRL(c.ticketMedio)}
                              </td>
                            </tr>
                          ))}
                          {clinicasOrdenadas.length === 0 && (
                            <tr>
                              <td colSpan={8} className="px-4 py-4 text-center text-muted">
                                Nenhum lançamento nesse mês.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
          {meses.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-muted">
                Nenhum resultado lançado ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {meses.length > 0 && (
        <p className="mt-3 text-[13px] text-muted">
          Setas: variação em relação ao mês anterior com lançamento (no detalhe, o da própria
          clínica).
        </p>
      )}
    </div>
  );
}
