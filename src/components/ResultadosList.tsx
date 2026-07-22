"use client";

import { Fragment, useState, useTransition } from "react";
import {
  createResultado,
  removeResultado,
  updateResultado,
} from "@/app/actions/resultados";
import { formatBRL, formatDate, formatMesAno } from "@/lib/format";
import type { ResultadoGrupo } from "@/lib/database.types";

const inputClass =
  "w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent";

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

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm text-text-secondary">Total (todos os lançamentos)</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <ResumoCard label="Investido" value={formatBRL(totais.investimento)} />
          <ResumoCard label="Leads" value={String(totais.leads)} />
          <ResumoCard
            label="CPL médio"
            value={calcCpl(totais.investimento, totais.leads)}
          />
          <ResumoCard label="Vendas" value={String(totalVendas)} />
          <ResumoCard
            label="Ticket médio"
            value={calcTicketMedio(totalFaturamento, totalVendas)}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-status-alert-bg px-3 py-2 text-sm text-status-alert-text">
          {error}
        </div>
      )}

      {meses.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-text-secondary">Por mês</p>
          <div className="overflow-x-auto rounded-xl border border-border bg-bg-surface">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary">
                  <th className="px-4 py-3 font-medium">Mês</th>
                  <th className="px-4 py-3 font-medium">Investido</th>
                  <th className="px-4 py-3 font-medium">Leads</th>
                  <th className="px-4 py-3 font-medium">CPL</th>
                  <th className="px-4 py-3 font-medium">Vendas</th>
                  <th className="px-4 py-3 font-medium">Faturamento</th>
                  <th className="px-4 py-3 font-medium">Ticket médio</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {meses.map(([chave, doMes]) => {
                  const [ano, mes] = chave.split("-").map(Number);
                  const s = somar(doMes);
                  const vendasMes = s.vendasCampanha + s.vendasTrafego;
                  const faturamentoMes = s.faturamentoCampanha + s.faturamentoTrafego;
                  const aberto = expandido === chave;
                  return (
                    <Fragment key={chave}>
                      <tr
                        className="cursor-pointer border-b border-border last:border-0 hover:bg-bg-surface-hover"
                        onClick={() => setExpandido(aberto ? null : chave)}
                      >
                        <td className="px-4 py-3 font-medium text-text-primary">
                          {formatMesAno(ano, mes)}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-text-primary">
                          {formatBRL(s.investimento)}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-text-primary">
                          {s.leads}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-text-primary">
                          {calcCpl(s.investimento, s.leads)}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-text-primary">
                          {vendasMes}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-status-ok-text">
                          {formatBRL(faturamentoMes)}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-text-primary">
                          {calcTicketMedio(faturamentoMes, vendasMes)}
                        </td>
                        <td className="px-4 py-3 text-right text-text-secondary">
                          {aberto ? "▲" : "▼"}
                        </td>
                      </tr>
                      {aberto && (
                        <tr className="border-b border-border last:border-0">
                          <td colSpan={8} className="bg-bg-surface-hover px-4 py-4">
                            <ul className="space-y-2">
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
        </div>
      )}

      {resultados.length === 0 && (
        <p className="text-sm text-text-secondary">
          Nenhum resultado registrado ainda.
        </p>
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
          className="space-y-4 rounded-xl border border-border bg-bg-surface p-6"
        >
          <ResultadoFields />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {isPending ? "Salvando…" : "Adicionar"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          + Novo resultado
        </button>
      )}
    </div>
  );
}

function ResumoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg-surface p-4">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="mt-1 font-display text-lg font-semibold tracking-tight tabular-nums text-text-primary">
        {value}
      </p>
    </div>
  );
}

function ResultadoFields({ defaultValues }: { defaultValues?: ResultadoGrupo }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm text-text-secondary">Data</label>
          <input
            type="date"
            name="data"
            defaultValue={defaultValues?.data ?? new Date().toISOString().slice(0, 10)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-secondary">
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
          <label className="mb-1 block text-sm text-text-secondary">Leads</label>
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
          <label className="mb-1 block text-sm text-text-secondary">
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
          <label className="mb-1 block text-sm text-text-secondary">
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
          <label className="mb-1 block text-sm text-text-secondary">
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
          <label className="mb-1 block text-sm text-text-secondary">
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
        <label className="mb-1 block text-sm text-text-secondary">
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
        className="rounded-lg border border-border bg-bg-surface px-4 py-3 text-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-text-primary">
            {formatDate(resultado.data)}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditing(true)}
              className="text-text-secondary hover:text-text-primary"
            >
              Editar
            </button>
            <button
              disabled={isPending}
              onClick={() => {
                if (!confirm("Remover este lançamento de resultado?")) return;
                startTransition(() => removeResultado(resultado.id, grupoId));
              }}
              className="text-text-secondary hover:text-status-alert-text"
            >
              Remover
            </button>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-text-secondary sm:grid-cols-4">
          <span>
            Investido:{" "}
            <span className="tabular-nums text-text-primary">
              {formatBRL(Number(resultado.investimento))}
            </span>
          </span>
          <span>
            Leads:{" "}
            <span className="tabular-nums text-text-primary">{resultado.leads}</span>
          </span>
          <span>
            CPL:{" "}
            <span className="tabular-nums text-text-primary">
              {calcCpl(Number(resultado.investimento), resultado.leads)}
            </span>
          </span>
          <span>
            Vendas:{" "}
            <span className="tabular-nums text-text-primary">{vendasTotal}</span>{" "}
            ({resultado.vendas_campanha_interna} campanha +{" "}
            {resultado.vendas_trafego_pago} tráfego)
          </span>
        </div>
        <p className="mt-1 text-xs text-text-secondary">
          Faturamento:{" "}
          <span className="tabular-nums text-status-ok-text">
            {formatBRL(faturamentoTotal)}
          </span>{" "}
          ({formatBRL(Number(resultado.faturamento_campanha_interna))} campanha
          interna + {formatBRL(Number(resultado.faturamento_trafego_pago))} tráfego
          pago) · Ticket médio:{" "}
          <span className="tabular-nums text-text-primary">
            {calcTicketMedio(faturamentoTotal, vendasTotal)}
          </span>
        </p>
        {resultado.observacao && (
          <p className="mt-1 text-xs text-text-secondary">{resultado.observacao}</p>
        )}
      </li>
    );
  }

  return (
    <li
      onClick={(e) => e.stopPropagation()}
      className="rounded-lg border border-border bg-bg-surface px-4 py-3"
    >
      {error && (
        <div className="mb-2 rounded-lg bg-status-alert-bg px-3 py-2 text-sm text-status-alert-text">
          {error}
        </div>
      )}
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
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="btn-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>
    </li>
  );
}
