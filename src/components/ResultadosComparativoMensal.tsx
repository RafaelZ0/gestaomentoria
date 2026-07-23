"use client";

import { Fragment, useState } from "react";
import { formatBRL, formatMesAno } from "@/lib/format";

export type LinhaClinicaMes = {
  id: string;
  nome: string;
  investimento: number;
  leads: number;
  vendas: number;
  faturamento: number;
  roas: number | null;
  ticketMedio: number | null;
};

export type MesComparativo = {
  mes: string;
  clinicas: LinhaClinicaMes[];
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

export function ResultadosComparativoMensal({
  meses,
}: {
  meses: MesComparativo[];
}) {
  const [expandido, setExpandido] = useState<string | null>(
    meses[0]?.mes ?? null
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="px-4 py-3 font-medium">Mês</th>
            <th className="px-4 py-3 font-medium">Investido</th>
            <th className="px-4 py-3 font-medium">Vendas</th>
            <th className="px-4 py-3 font-medium">Faturamento</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {meses.map(({ mes, clinicas }) => {
            const [ano, mesNum] = mes.split("-").map(Number);
            const s = somar(clinicas);
            const aberto = expandido === mes;
            const clinicasOrdenadas = [...clinicas].sort(
              (a, b) => b.faturamento - a.faturamento
            );

            return (
              <Fragment key={mes}>
                <tr
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-bg-surface-hover"
                  onClick={() => setExpandido(aberto ? null : mes)}
                >
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {formatMesAno(ano, mesNum)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-text-primary">
                    {formatBRL(s.investimento)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-text-primary">
                    {s.vendas}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-status-ok-text">
                    {formatBRL(s.faturamento)}
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary">
                    {aberto ? "▲" : "▼"}
                  </td>
                </tr>
                {aberto && (
                  <tr className="border-b border-border last:border-0">
                    <td colSpan={5} className="bg-bg-surface-hover p-0">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border text-text-secondary">
                            <th className="px-4 py-2 font-medium">Clínica</th>
                            <th className="px-4 py-2 font-medium">Investido</th>
                            <th className="px-4 py-2 font-medium">Leads</th>
                            <th className="px-4 py-2 font-medium">Vendas</th>
                            <th className="px-4 py-2 font-medium">Faturamento</th>
                            <th className="px-4 py-2 font-medium">ROAS</th>
                            <th className="px-4 py-2 font-medium">Ticket médio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clinicasOrdenadas.map((c) => (
                            <tr key={c.id} className="border-b border-border last:border-0">
                              <td className="px-4 py-2 font-medium text-text-primary">
                                {c.nome}
                              </td>
                              <td className="px-4 py-2 tabular-nums text-text-primary">
                                {formatBRL(c.investimento)}
                              </td>
                              <td className="px-4 py-2 tabular-nums text-text-primary">
                                {c.leads}
                              </td>
                              <td className="px-4 py-2 tabular-nums text-text-primary">
                                {c.vendas}
                              </td>
                              <td className="px-4 py-2 tabular-nums text-status-ok-text">
                                {formatBRL(c.faturamento)}
                              </td>
                              <td className="px-4 py-2 tabular-nums text-text-primary">
                                {c.roas === null ? "—" : `${c.roas.toFixed(1)}x`}
                              </td>
                              <td className="px-4 py-2 tabular-nums text-text-primary">
                                {c.ticketMedio === null ? "—" : formatBRL(c.ticketMedio)}
                              </td>
                            </tr>
                          ))}
                          {clinicasOrdenadas.length === 0 && (
                            <tr>
                              <td
                                colSpan={7}
                                className="px-4 py-4 text-center text-text-secondary"
                              >
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
              <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                Nenhum resultado lançado ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
