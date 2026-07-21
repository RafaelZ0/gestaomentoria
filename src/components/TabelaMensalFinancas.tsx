"use client";

import { Fragment, useState, useTransition } from "react";
import { formatBRL, formatMesAno, formatDate } from "@/lib/format";
import { LancamentosList } from "@/components/LancamentosList";
import {
  addCustoMensalItem,
  removeCustoMensalItem,
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
                        (custos lançados à mão)
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
                            Custo fixo de referência (atual): {" "}
                            {formatBRL(custosFixosAtual)}. Enquanto não há
                            itens lançados à mão para este mês, o gasto usa
                            essa referência. Assim que você lançar ao menos um
                            item, o gasto passa a ser a soma dos itens abaixo.
                          </p>
                          <div className="mt-2">
                            <CustosFixosMensaisEditor
                              ano={m.ano}
                              mes={m.mes}
                              itens={m.custosFixosItens}
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

function CustosFixosMensaisEditor({
  ano,
  mes,
  itens,
}: {
  ano: number;
  mes: number;
  itens: { id: string; nome: string; valor: number }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-status-alert-bg px-3 py-2 text-xs text-status-alert-text">
          {error}
        </div>
      )}

      {itens.length > 0 && (
        <ul className="space-y-1">
          {itens.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm"
            >
              <span className="text-text-primary">{item.nome}</span>
              <div className="flex items-center gap-3">
                <span className="tabular-nums text-status-alert-text">
                  {formatBRL(item.valor)}
                </span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => removeCustoMensalItem(item.id))
                  }
                  className="text-xs text-text-secondary hover:text-status-alert-text"
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        action={(formData) => {
          setError(null);
          const nome = String(formData.get("nome") ?? "");
          const valor = Number(formData.get("valor") ?? 0);
          startTransition(async () => {
            try {
              await addCustoMensalItem(ano, mes, nome, valor);
              (
                document.getElementById(
                  `custo-item-form-${ano}-${mes}`
                ) as HTMLFormElement | null
              )?.reset();
            } catch (e) {
              if (e instanceof Error) setError(e.message);
            }
          });
        }}
        id={`custo-item-form-${ano}-${mes}`}
        className="flex items-end gap-2"
      >
        <div className="flex-1">
          <label className="mb-1 block text-xs text-text-secondary">
            Novo custo de {formatMesAno(ano, mes)}
          </label>
          <input
            name="nome"
            placeholder="Ex: Ferramenta X"
            required
            className="w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
          />
        </div>
        <div className="w-32">
          <label className="mb-1 block text-xs text-text-secondary">
            Valor (R$)
          </label>
          <input
            name="valor"
            type="number"
            step="0.01"
            min="0"
            required
            className="w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent tabular-nums"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          Adicionar
        </button>
      </form>
    </div>
  );
}
