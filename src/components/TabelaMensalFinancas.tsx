"use client";

import { useState, useTransition } from "react";
import { displayGroupName, formatBRL, formatMesAno, formatDate } from "@/lib/format";
import { LancamentosList } from "@/components/LancamentosList";
import { RowMenu } from "@/components/ui/RowMenu";
import { Icon } from "@/components/ui/Icon";
import { addCustoMensalItem, removeCustoMensalItem } from "@/app/actions/financas";
import type { MesFinanceiro } from "@/lib/finance";
import type { LancamentoFinanceiro } from "@/lib/database.types";

const COLUNAS = "grid-cols-[1.3fr_1fr_1fr_1.3fr_1fr_24px]";

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
    <div className="overflow-x-auto">
      <div className="min-w-[680px]">
        <div className={`grid ${COLUNAS} gap-3 border-b border-line px-3 pb-2.5 pt-3 text-[12.5px] text-subtle`}>
          <span>Mês</span>
          <span className="text-right">Entrada</span>
          <span className="text-right">Faturamento</span>
          <span className="text-right">Gasto</span>
          <span className="text-right">Lucro</span>
          <span />
        </div>

        {meses.map((m) => {
          const key = `${m.ano}-${m.mes}`;
          const aberto = expandido === key;
          const lancamentosDoMes = lancamentos.filter((l) => {
            const [ano, mes] = l.data.split("-").map(Number);
            return ano === m.ano && mes === m.mes;
          });

          return (
            <div key={key} className="border-b border-line-soft last:border-b-0">
              <button
                type="button"
                onClick={() => setExpandido(aberto ? null : key)}
                aria-expanded={aberto}
                className={`grid w-full ${COLUNAS} items-center gap-3 px-3 py-3 text-left text-[14.5px] transition-colors hover:bg-hover ${
                  aberto ? "bg-hover" : ""
                }`}
              >
                <span className="text-text">{formatMesAno(m.ano, m.mes)}</span>
                <span className="text-right tabular-nums text-text">{formatBRL(m.entrada)}</span>
                <span className="text-right tabular-nums text-text-2">{formatBRL(m.faturamento)}</span>
                <span className="text-right tabular-nums text-text-2">
                  {formatBRL(m.gasto)}
                  {m.custosFixosManual && (
                    <span className="block text-[11.5px] text-subtle">custos lançados à mão</span>
                  )}
                </span>
                <span
                  className={`text-right font-medium tabular-nums ${
                    m.lucro >= 0 ? "text-text" : "text-danger"
                  }`}
                >
                  {formatBRL(m.lucro)}
                </span>
                <span className={`text-subtle transition-transform ${aberto ? "rotate-180" : ""}`}>
                  <Icon nome="chevronBaixo" tamanho={16} />
                </span>
              </button>

              {aberto && (
                <div className="flex flex-col gap-8 px-3 pb-8 pt-5">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="flex flex-col">
                      <h3 className="mb-1 text-[13.5px] font-semibold text-text">
                        De onde vem a entrada
                      </h3>
                      {m.mensalidadesDetalhe.map((p, i) => (
                        <LinhaValor
                          key={`mensalidade-${i}`}
                          rotulo={
                            <>
                              {displayGroupName(p.grupoNome)} ({formatDate(p.data)})
                              {p.viaAsaas && <span className="ml-2 text-[12px] text-subtle">via Asaas</span>}
                            </>
                          }
                          valor={formatBRL(p.valor)}
                        />
                      ))}
                      {m.clausulasDetalhe.map((c, i) => (
                        <LinhaValor
                          key={`clausula-${i}`}
                          rotulo={`Cláusula de cancelamento — ${displayGroupName(c.grupoNome)} (${formatDate(c.data)})`}
                          valor={formatBRL(c.valor)}
                        />
                      ))}
                      {m.mensalidadesDetalhe.length === 0 && m.clausulasDetalhe.length === 0 && (
                        <p className="py-2 text-[13.5px] text-muted">
                          Nenhum pagamento registrado neste mês.
                        </p>
                      )}
                      <h4 className="mb-1 mt-5 text-[13px] text-subtle">Receitas avulsas</h4>
                      <LancamentosList
                        lancamentos={lancamentosDoMes.filter((l) => l.tipo === "RECEITA")}
                      />
                    </div>

                    <div className="flex flex-col">
                      <h3 className="mb-1 text-[13.5px] font-semibold text-text">
                        Faturamento vendido este mês
                      </h3>
                      {m.vendasDetalhe.map((v, i) => (
                        <LinhaValor
                          key={`venda-${i}`}
                          rotulo={`${displayGroupName(v.grupoNome)} (fechou acompanhamento)`}
                          valor={formatBRL(v.valor)}
                        />
                      ))}
                      {m.vendasDetalhe.length === 0 && (
                        <p className="py-2 text-[13.5px] text-muted">
                          Nenhum grupo novo fechado neste mês.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <h3 className="text-[13.5px] font-semibold text-text">De onde vem o gasto</h3>
                    <p className="mt-1 text-[13px] text-muted">
                      Custo fixo de referência (atual): {formatBRL(custosFixosAtual)}. Enquanto não
                      há itens lançados à mão para este mês, o gasto usa essa referência. Assim que
                      você lançar ao menos um item, o gasto passa a ser a soma dos itens abaixo.
                    </p>
                    <div className="mt-2">
                      <CustosFixosMensaisEditor ano={m.ano} mes={m.mes} itens={m.custosFixosItens} />
                    </div>
                    <h4 className="mb-1 mt-5 text-[13px] text-subtle">Despesas avulsas</h4>
                    <LancamentosList
                      lancamentos={lancamentosDoMes.filter((l) => l.tipo === "DESPESA")}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {meses.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-muted">
            Sem dados suficientes ainda para montar a tabela mensal.
          </p>
        )}
      </div>
    </div>
  );
}

function LinhaValor({ rotulo, valor }: { rotulo: React.ReactNode; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line-soft py-2 text-[14px] last:border-b-0">
      <span className="text-text-2">{rotulo}</span>
      <span className="shrink-0 tabular-nums text-text">{valor}</span>
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
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-danger">{error}</p>}

      {itens.length > 0 && (
        <div className="flex flex-col">
          {itens.map((item) => (
            <div
              key={item.id}
              className="flex min-h-11 items-center justify-between gap-4 border-b border-line-soft py-1.5 text-[14px]"
            >
              <span className="text-text">{item.nome}</span>
              <div className="flex items-center gap-3">
                <span className="tabular-nums text-text-2">{formatBRL(item.valor)}</span>
                <RowMenu
                  rotulo={`Mais opções de ${item.nome}`}
                  acoes={[
                    {
                      label: "Remover",
                      destrutiva: true,
                      confirmar: {
                        titulo: `Remover ${item.nome}?`,
                        texto: `Custo de ${formatMesAno(ano, mes)} · ${formatBRL(item.valor)}`,
                        botao: "Remover",
                      },
                      onSelect: () => removeCustoMensalItem(item.id),
                    },
                  ]}
                />
              </div>
            </div>
          ))}
        </div>
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
                document.getElementById(`custo-item-form-${ano}-${mes}`) as HTMLFormElement | null
              )?.reset();
            } catch (e) {
              if (e instanceof Error) setError(e.message);
            }
          });
        }}
        id={`custo-item-form-${ano}-${mes}`}
        className="flex flex-wrap items-end gap-2"
      >
        <div className="min-w-48 flex-1">
          <label className="rotulo mb-1.5">Novo custo de {formatMesAno(ano, mes)}</label>
          <input name="nome" placeholder="Ex: Ferramenta X" required className="campo" />
        </div>
        <div className="w-32">
          <label className="rotulo mb-1.5">Valor (R$)</label>
          <input name="valor" type="number" step="0.01" min="0" required className="campo tabular-nums" />
        </div>
        <button type="submit" disabled={isPending} className="btn-secondary">
          Adicionar
        </button>
      </form>
    </div>
  );
}
