"use client";

import { useState, useTransition } from "react";
import { createPagamento } from "@/app/actions/pagamentos";

export function NovoPagamentoForm({
  grupoId,
  valorSugerido,
}: {
  grupoId: string;
  valorSugerido: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
      >
        + Registrar pagamento
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            await createPagamento(grupoId, formData);
            setOpen(false);
          } catch (e) {
            if (e instanceof Error) setError(e.message);
          }
        });
      }}
      className="space-y-4 rounded-xl border border-border bg-bg-surface p-6"
    >
      {error && (
        <div className="rounded-lg bg-status-alert-bg px-3 py-2 text-sm text-status-alert-text">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-text-secondary">Data</label>
          <input
            type="date"
            name="data"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
            className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-secondary">Valor (R$)</label>
          <input
            type="number"
            name="valor"
            step="0.01"
            min="0"
            defaultValue={valorSugerido}
            required
            className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent tabular-nums"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm text-text-secondary">Observação</label>
        <input
          name="observacao"
          className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {isPending ? "Salvando…" : "Registrar"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-bg-surface-hover"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
