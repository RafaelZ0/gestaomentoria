"use client";

import { Fragment, useState, useTransition } from "react";
import { formatBRL, formatMesAno, formatDate } from "@/lib/format";
import { LancamentosList } from "@/components/LancamentosList";
import {
  removeCustoFixoMensal,
  upsertCustoFixoMensal,
} from "@/app/actions/financas";
import type { MesFinanceiro } from "@/lib/finance";
import type { LancamentoFinanceiro } from "@/lib/database.types";

export function TabelaMensalFinancas({
  meses,
  lancamentos,
  custosFixosAtual,
}: {
  meses: MesFinanceiro[];
  lancamentos: LancamentoFinanceiro[];
  custosFixosAtual: number;
}) {
  const [expandido, setExpandido] = useState<string | null>(null);

  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="px-4 py-3 font-medium">Mês</th>
            <th className="px-4 py-3 font-medium">Receita</th>
            <th className="px-4 py-3 font-medium">Gasto</th>
            <th className="px-4 py-3 font-medium">Lucro</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {meses.map((m) => {
            const key = `${m.ano}-${m.mes}`;
            const aberto = expandido === key;
            const lancamentosDoMes = lancamentos.filter((l) => {
              const [ano, mes] = l.data.split("-").map(Number);
              return ano === m.ano && mes === m.mes;
            });

            return (
              <Fragment key={key}>
                <tr
                  className="border-b border-border last:border-0 cursor-pointer hover:bg-bg-surface-hover"
                  onClick={() => setExpandido(aberto ? null : key)}
                >
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {formatMesAno(m.ano, m.mes)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-status-ok-text">
                    {formatBRL(m.receita)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-status-alert-text">
                    {formatBRL(m.gasto)}
                    {m.custosFixosManual && (
                      <span className="ml-1 text-xs text-text-secondary">
                        (custo fixo editado)
                      </span>
                    )}
                  </td>
                  <td
                    className={`px-4 py-3 tabular-nums font-medium ${
                      m.lucro >= 0 ? "text-text-primary" : "text-status-alert-text"
                    }`}
                  >
                    {formatBRL(m.lucro)}
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary">
                    {aberto ? "▲" : "▼"}
                  </td>
                </tr>
                {aberto && (
                  <tr key={`${key}-detalhe`} className="border-b border-border last:border-0">
                    <td colSpan={5} className="bg-bg-surface-hover px-4 py-5">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                          <h3 className="font-display text-sm font-semibold text-text-primary">
                            De onde vem a receita
                          </h3>
                          <ul className="mt-2 space-y-1 text-sm">
                            {m.gruposDetalhe.map((g) => (
                              <li
                                key={g.grupoId}
                                className="flex items-center justify-between text-text-secondary"
                              >
                                <span>{g.nome} (mensalidade vencida)</span>
                                <span className="tabular-nums text-text-primary">
                                  {formatBRL(g.valor)}
                                </span>
                              </li>
                            ))}
                            {m.clausulasDetalhe.map((c, i) => (
                              <li
                                key={`clausula-${i}`}
                                className="flex items-center justify-between text-text-secondary"
                              >
                                <span>
                                  Cláusula de cancelamento — {c.grupoNome} (
                                  {formatDate(c.data)})
                                </span>
                                <span className="tabular-nums text-status-ok-text">
                                  {formatBRL(c.valor)}
                                </span>
                              </li>
                            ))}
                            {m.gruposDetalhe.length === 0 &&
                              m.clausulasDetalhe.length === 0 && (
                                <li className="text-text-secondary">
                                  Nenhuma mensalidade vencida ou cláusula neste
                                  mês.
                                </li>
                              )}
                          </ul>
                        </div>

                        <div>
                          <h3 className="font-display text-sm font-semibold text-text-primary">
                            De onde vem o gasto
                          </h3>
                          <p className="mt-1 text-xs text-text-secondary">
                            Custo fixo total deste mês. Por padrão segue o
                            valor atual (
                            {formatBRL(custosFixosAtual)}), mas pode ser
                            ajustado para refletir o que você gastava naquele
                            período.
                          </p>
                          <div className="mt-2">
                            <CustoFixoMensalEditor
                              ano={m.ano}
                              mes={m.mes}
                              valor={m.custosFixos}
                              manual={m.custosFixosManual}
                              valorAtual={custosFixosAtual}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h3 className="font-display text-sm font-semibold text-text-primary">
                          Lançamentos avulsos deste mês
                        </h3>
                        <p className="mt-1 text-xs text-text-secondary">
                          Receitas e despesas avulsas lançadas em{" "}
                          {formatMesAno(m.ano, m.mes)}. Edite ou remova aqui, ou
                          adicione uma nova.
                        </p>
                        <div className="mt-3">
                          <LancamentosList lancamentos={lancamentosDoMes} />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
          {meses.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                Sem dados suficientes ainda para montar a tabela mensal.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function CustoFixoMensalEditor({
  ano,
  mes,
  valor,
  manual,
  valorAtual,
}: {
  ano: number;
  mes: number;
  valor: number;
  manual: boolean;
  valorAtual: number;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        const novoValor = Number(formData.get("valor") ?? 0);
        startTransition(() => upsertCustoFixoMensal(ano, mes, novoValor));
      }}
      className="flex items-end gap-3"
    >
      <div className="flex-1">
        <label className="mb-1 block text-xs text-text-secondary">
          Custo fixo de {formatMesAno(ano, mes)} (R$)
        </label>
        <input
          name="valor"
          type="number"
          step="0.01"
          min="0"
          defaultValue={valor}
          className="w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent tabular-nums"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        Salvar
      </button>
      {manual && (
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() => removeCustoFixoMensal(ano, mes))
          }
          className="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:bg-bg-surface-hover disabled:opacity-60"
        >
          Usar atual ({formatBRL(valorAtual)})
        </button>
      )}
    </form>
  );
}
