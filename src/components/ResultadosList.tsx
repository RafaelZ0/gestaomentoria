"use client";

import { useState, useTransition } from "react";
import {
  createResultado,
  removeResultado,
  updateResultado,
} from "@/app/actions/resultados";
import { formatBRL, formatDate } from "@/lib/format";
import type { ResultadoGrupo } from "@/lib/database.types";

const inputClass =
  "w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent";

function calcCpl(investimento: number, leads: number): string {
  if (!leads) return "—";
  return formatBRL(investimento / leads);
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

  const totais = resultados.reduce(
    (acc, r) => ({
      investimento: acc.investimento + Number(r.investimento),
      leads: acc.leads + r.leads,
      vendas: acc.vendas + r.vendas,
      faturamento:
        acc.faturamento +
        Number(r.faturamento_campanha_interna) +
        Number(r.faturamento_trafego_pago),
    }),
    { investimento: 0, leads: 0, vendas: 0, faturamento: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ResumoCard label="Investido" value={formatBRL(totais.investimento)} />
        <ResumoCard label="Leads" value={String(totais.leads)} />
        <ResumoCard
          label="CPL médio"
          value={calcCpl(totais.investimento, totais.leads)}
        />
        <ResumoCard label="Vendas" value={String(totais.vendas)} />
      </div>

      {error && (
        <div className="rounded-lg bg-status-alert-bg px-3 py-2 text-sm text-status-alert-text">
          {error}
        </div>
      )}

      <ul className="space-y-2">
        {resultados.map((r) => (
          <ResultadoRow key={r.id} grupoId={grupoId} resultado={r} />
        ))}
        {resultados.length === 0 && (
          <p className="text-sm text-text-secondary">
            Nenhum resultado registrado ainda.
          </p>
        )}
      </ul>

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm text-text-secondary">Vendas</label>
          <input
            type="number"
            name="vendas"
            min="0"
            step="1"
            defaultValue={defaultValues?.vendas ?? 0}
            className={`${inputClass} tabular-nums`}
          />
        </div>
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

  const faturamentoTotal =
    Number(resultado.faturamento_campanha_interna) +
    Number(resultado.faturamento_trafego_pago);

  if (!editing) {
    return (
      <li className="rounded-lg border border-border bg-bg-surface-hover px-4 py-3 text-sm">
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
              onClick={() =>
                startTransition(() => removeResultado(resultado.id, grupoId))
              }
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
            <span className="tabular-nums text-text-primary">{resultado.vendas}</span>
          </span>
        </div>
        <p className="mt-1 text-xs text-text-secondary">
          Faturamento:{" "}
          <span className="tabular-nums text-status-ok-text">
            {formatBRL(faturamentoTotal)}
          </span>{" "}
          ({formatBRL(Number(resultado.faturamento_campanha_interna))} campanha
          interna + {formatBRL(Number(resultado.faturamento_trafego_pago))} tráfego
          pago)
        </p>
        {resultado.observacao && (
          <p className="mt-1 text-xs text-text-secondary">{resultado.observacao}</p>
        )}
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-border bg-bg-surface-hover px-4 py-3">
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
