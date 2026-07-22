"use client";

import { formatBRL, formatMesAno } from "@/lib/format";

export type LinhaMensal = {
  mes: string;
  investimento: number;
  leads: number;
  vendas: number;
  faturamento: number;
  roas: number | null;
  ticketMedio: number | null;
};

export function ResultadosPorMesTable({ linhas }: { linhas: LinhaMensal[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="px-4 py-3 font-medium">Mês</th>
            <th className="px-4 py-3 font-medium">Investido</th>
            <th className="px-4 py-3 font-medium">Leads</th>
            <th className="px-4 py-3 font-medium">Vendas</th>
            <th className="px-4 py-3 font-medium">Faturamento</th>
            <th className="px-4 py-3 font-medium">ROAS</th>
            <th className="px-4 py-3 font-medium">Ticket médio</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => {
            const [ano, mes] = l.mes.split("-").map(Number);
            return (
              <tr
                key={l.mes}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3 font-medium text-text-primary">
                  {formatMesAno(ano, mes)}
                </td>
                <td className="px-4 py-3 tabular-nums text-text-primary">
                  {formatBRL(l.investimento)}
                </td>
                <td className="px-4 py-3 tabular-nums text-text-primary">
                  {l.leads}
                </td>
                <td className="px-4 py-3 tabular-nums text-text-primary">
                  {l.vendas}
                </td>
                <td className="px-4 py-3 tabular-nums text-status-ok-text">
                  {formatBRL(l.faturamento)}
                </td>
                <td className="px-4 py-3 tabular-nums text-text-primary">
                  {l.roas === null ? "—" : `${l.roas.toFixed(1)}x`}
                </td>
                <td className="px-4 py-3 tabular-nums text-text-primary">
                  {l.ticketMedio === null ? "—" : formatBRL(l.ticketMedio)}
                </td>
              </tr>
            );
          })}
          {linhas.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                Nenhum resultado lançado ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
