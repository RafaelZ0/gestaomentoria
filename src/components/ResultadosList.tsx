"use client";

import { Fragment, useState, useTransition } from "react";
import {
  createResultado,
  removeResultado,
  updateResultado,
} from "@/app/actions/resultados";
import { formatBRL, formatDate, formatMesAno } from "@/lib/format";
import type { ResultadoGrupo } from "@/lib/database.types";
import { Metric } from "@/components/ui/Metric";
import { Tendencia } from "@/components/ui/Tendencia";
import { roasDe, variacoesEntre, type MetricasMes } from "@/lib/tendencia";
import { RowMenu } from "@/components/ui/RowMenu";

const inputClass =
  "campo w-full";

function calcCpl(investimento: number, leads: number): string {
  if (!leads) return "—";
  return formatBRL(investimento / leads);
}

function calcTicketMedio(faturamento: number, vendas: number): string {
  if (!vendas) return "—";
  return formatBRL(faturamento / vendas);
}

function somar(resultados: ResultadoGrupo[]) {
  return resultados.reduce(
    (acc, r) => ({
      investimento: acc.investimento + Number(r.investimento),
      leads: acc.leads + r.leads,
      vendasCampanha: acc.vendasCampanha + r.vendas_campanha_interna,
      vendasTrafego: acc.vendasTrafego + r.vendas_trafego_pago,
      faturamentoCampanha:
        acc.faturamentoCampanha + Number(r.faturamento_campanha_interna),
      faturamentoTrafego:
        acc.faturamentoTrafego + Number(r.faturamento_trafego_pago),
    }),
    {
      investimento: 0,
      leads: 0,
      vendasCampanha: 0,
      vendasTrafego: 0,
      faturamentoCampanha: 0,
      faturamentoTrafego: 0,
    }
  );
}

export function ResultadosList({
  grupoId,
  resultados,
}: {
  grupoId: string;
  resultados: ResultadoGrupo[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);

  const totais = somar(resultados);
  const totalVendas = totais.vendasCampanha + totais.vendasTrafego;
  const totalFaturamento = totais.faturamentoCampanha + totais.faturamentoTrafego;

  const porMes = new Map<string, ResultadoGrupo[]>();
  for (const r of resultados) {
    const chave = r.data.slice(0, 7);
    const lista = porMes.get(chave) ?? [];
    lista.push(r);
    porMes.set(chave, lista);
  }
  const meses = [...porMes.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  function metricasDoMes(doMes: ResultadoGrupo[]): MetricasMes {
    const s = somar(doMes);
    return {
      investimento: s.investimento,
      leads: s.leads,
      vendas: s.vendasCampanha + s.vendasTrafego,
      faturamento: s.faturamentoCampanha + s.faturamentoTrafego,
    };
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 border-b border-line pb-7">
        <h2 className="text-[15px] font-semibold text-text">Total (todos os lançamentos)</h2>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-5">
          <Metric rotulo="Investido">{formatBRL(totais.investimento)}</Metric>
          <Metric rotulo="Leads">{totais.leads}</Metric>
          <Metric rotulo="CPL médio">{calcCpl(totais.investimento, totais.leads)}</Metric>
          <Metric rotulo="Vendas">{totalVendas}</Metric>
          <Metric rotulo="Ticket médio">{calcTicketMedio(totalFaturamento, totalVendas)}</Metric>
        </div>
      </section>

      {error && <p className="text-sm text-danger">{error}</p>}

      {meses.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[15px] font-semibold text-text">Por mês</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[14.5px]">
              <thead>
                <tr className="border-b border-line text-[13px] text-muted">
                  <th className="px-3 pb-2.5 pt-3 font-normal">Mês</th>
                  <th className="px-3 pb-2.5 pt-3 font-normal">Investido</th>
                  <th className="px-3 pb-2.5 pt-3 font-normal">Leads</th>
                  <th className="px-3 pb-2.5 pt-3 font-normal">CPL</th>
                  <th className="px-3 pb-2.5 pt-3 font-normal">ROAS</th>
                  <th className="px-3 pb-2.5 pt-3 font-normal">Vendas</th>
                  <th className="px-3 pb-2.5 pt-3 font-normal">Faturamento</th>
                  <th className="px-3 pb-2.5 pt-3 font-normal">Ticket médio</th>
                  <th className="px-3 pb-2.5 pt-3"></th>
                </tr>
              </thead>
              <tbody>
                {meses.map(([chave, doMes], i) => {
                  const [ano, mes] = chave.split("-").map(Number);
                  const s = somar(doMes);
                  const vendasMes = s.vendasCampanha + s.vendasTrafego;
                  const faturamentoMes = s.faturamentoCampanha + s.faturamentoTrafego;
                  const aberto = expandido === chave;
                  const m = metricasDoMes(doMes);
                  const roasMes = roasDe(m);
                  // Comparado com o mês anterior que teve lançamento (próximo da lista).
                  const v = variacoesEntre(m, meses[i + 1] ? metricasDoMes(meses[i + 1][1]) : null);
                  return (
                    <Fragment key={chave}>
                      <tr
                        className={`cursor-pointer border-b border-line-soft transition-colors last:border-0 hover:bg-hover ${aberto ? "bg-hover" : ""}`}
                        onClick={() => setExpandido(aberto ? null : chave)}
                        aria-expanded={aberto}
                      >
                        <td className="px-3 py-3 text-text">{formatMesAno(ano, mes)}</td>
                        <td className="px-3 py-3 tabular-nums text-text">{formatBRL(s.investimento)}</td>
                        <td className="px-3 py-3 tabular-nums text-text">{s.leads}</td>
                        <td className="px-3 py-3 tabular-nums text-text">
                          {calcCpl(s.investimento, s.leads)}
                          <Tendencia v={v.cpl} melhorQuandoMaior={false} />
                        </td>
                        <td className="px-3 py-3 tabular-nums text-text">
                          {roasMes === null ? "—" : `${roasMes.toFixed(1)}x`}
                          <Tendencia v={v.roas} />
                        </td>
                        <td className="px-3 py-3 tabular-nums text-text">
                          {vendasMes}
                          <Tendencia v={v.vendas} />
                        </td>
                        <td className="px-3 py-3 tabular-nums text-text">
                          {formatBRL(faturamentoMes)}
                          <Tendencia v={v.faturamento} />
                        </td>
                        <td className="px-3 py-3 tabular-nums text-text">
                          {calcTicketMedio(faturamentoMes, vendasMes)}
                        </td>
                        <td className="px-3 py-3 text-right text-subtle">
                          <span className={`inline-block transition-transform ${aberto ? "rotate-180" : ""}`}>▾</span>
                        </td>
                      </tr>
                      {aberto && (
                        <tr className="border-b border-line-soft last:border-0">
                          <td colSpan={9} className="px-3 pb-4">
                            <ul className="flex flex-col">
                              {doMes.map((r) => (
                                <ResultadoRow key={r.id} grupoId={grupoId} resultado={r} />
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {resultados.length === 0 && (
        <p className="text-sm text-muted">Nenhum resultado registrado ainda.</p>
      )}

      {open ? (
        <form
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              try {
                await createResultado(grupoId, formData);
                setOpen(false);
              } catch (e) {
                if (e instanceof Error) setError(e.message);
              }
            });
          }}
          className="flex flex-col gap-4 border-y border-line py-6"
        >
          <h2 className="text-[15px] font-semibold text-text">Novo resultado</h2>
          <ResultadoFields />
          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="btn-secondary">
              {isPending ? "Salvando…" : "Adicionar"}
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="btn-secondary w-fit">
          Novo resultado
        </button>
      )}
    </div>
  );
}

function ResultadoFields({ defaultValues }: { defaultValues?: ResultadoGrupo }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="rotulo mb-1.5">Data</label>
          <input
            type="date"
            name="data"
            defaultValue={defaultValues?.data ?? new Date().toISOString().slice(0, 10)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="rotulo mb-1.5">
            Investimento (R$)
          </label>
          <input
            type="number"
            name="investimento"
            step="0.01"
            min="0"
            defaultValue={defaultValues?.investimento ?? 0}
            className={`${inputClass} tabular-nums`}
          />
        </div>
        <div>
          <label className="rotulo mb-1.5">Leads</label>
          <input
            type="number"
            name="leads"
            min="0"
            step="1"
            defaultValue={defaultValues?.leads ?? 0}
            className={`${inputClass} tabular-nums`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="rotulo mb-1.5">
            Vendas — campanha interna
          </label>
          <input
            type="number"
            name="vendas_campanha_interna"
            min="0"
            step="1"
            defaultValue={defaultValues?.vendas_campanha_interna ?? 0}
            className={`${inputClass} tabular-nums`}
          />
        </div>
        <div>
          <label className="rotulo mb-1.5">
            Vendas — tráfego pago
          </label>
          <input
            type="number"
            name="vendas_trafego_pago"
            min="0"
            step="1"
            defaultValue={defaultValues?.vendas_trafego_pago ?? 0}
            className={`${inputClass} tabular-nums`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="rotulo mb-1.5">
            Faturamento — campanha interna (R$)
          </label>
          <input
            type="number"
            name="faturamento_campanha_interna"
            step="0.01"
            min="0"
            defaultValue={defaultValues?.faturamento_campanha_interna ?? 0}
            className={`${inputClass} tabular-nums`}
          />
        </div>
        <div>
          <label className="rotulo mb-1.5">
            Faturamento — tráfego pago (R$)
          </label>
          <input
            type="number"
            name="faturamento_trafego_pago"
            step="0.01"
            min="0"
            defaultValue={defaultValues?.faturamento_trafego_pago ?? 0}
            className={`${inputClass} tabular-nums`}
          />
        </div>
      </div>

      <div>
        <label className="rotulo mb-1.5">
          Observação (opcional)
        </label>
        <input
          name="observacao"
          defaultValue={defaultValues?.observacao ?? ""}
          className={inputClass}
        />
      </div>
    </>
  );
}

function ResultadoRow({
  grupoId,
  resultado,
}: {
  grupoId: string;
  resultado: ResultadoGrupo;
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const vendasTotal = resultado.vendas_campanha_interna + resultado.vendas_trafego_pago;
  const faturamentoTotal =
    Number(resultado.faturamento_campanha_interna) +
    Number(resultado.faturamento_trafego_pago);

  if (!editing) {
    return (
      <li
        onClick={(e) => e.stopPropagation()}
        className="border-b border-line-soft py-3 text-sm last:border-b-0"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-text">{formatDate(resultado.data)}</span>
          <RowMenu
            rotulo={`Mais opções do lançamento de ${formatDate(resultado.data)}`}
            acoes={[
              { label: "Editar", onSelect: () => setEditing(true) },
              {
                label: "Remover",
                destrutiva: true,
                confirmar: {
                  titulo: "Remover este lançamento de resultado?",
                  botao: "Remover",
                },
                onSelect: () =>
                  new Promise<void>((resolve) =>
                    startTransition(async () => {
                      await removeResultado(resultado.id, grupoId);
                      resolve();
                    })
                  ),
              },
            ]}
          />
        </div>
        <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] text-muted sm:grid-cols-4">
          <span>
            Investido:{" "}
            <span className="tabular-nums text-text">
              {formatBRL(Number(resultado.investimento))}
            </span>
          </span>
          <span>
            Leads:{" "}
            <span className="tabular-nums text-text">{resultado.leads}</span>
          </span>
          <span>
            CPL:{" "}
            <span className="tabular-nums text-text">
              {calcCpl(Number(resultado.investimento), resultado.leads)}
            </span>
          </span>
          <span>
            Vendas:{" "}
            <span className="tabular-nums text-text">{vendasTotal}</span>{" "}
            ({resultado.vendas_campanha_interna} campanha +{" "}
            {resultado.vendas_trafego_pago} tráfego)
          </span>
        </div>
        <p className="mt-1 text-[13px] text-muted">
          Faturamento:{" "}
          <span className="tabular-nums text-text">
            {formatBRL(faturamentoTotal)}
          </span>{" "}
          ({formatBRL(Number(resultado.faturamento_campanha_interna))} campanha
          interna + {formatBRL(Number(resultado.faturamento_trafego_pago))} tráfego
          pago) · Ticket médio:{" "}
          <span className="tabular-nums text-text">
            {calcTicketMedio(faturamentoTotal, vendasTotal)}
          </span>
        </p>
        {resultado.observacao && (
          <p className="mt-1 text-xs text-text-2">{resultado.observacao}</p>
        )}
      </li>
    );
  }

  return (
    <li onClick={(e) => e.stopPropagation()} className="border-b border-line-soft py-4 last:border-b-0">
      {error && <p className="mb-2 text-sm text-danger">{error}</p>}
      <form
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            try {
              await updateResultado(resultado.id, grupoId, formData);
              setEditing(false);
            } catch (e) {
              if (e instanceof Error) setError(e.message);
            }
          });
        }}
        className="space-y-4"
      >
        <ResultadoFields defaultValues={resultado} />
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={isPending} className="btn-secondary">
            Salvar
          </button>
        </div>
      </form>
    </li>
  );
}
