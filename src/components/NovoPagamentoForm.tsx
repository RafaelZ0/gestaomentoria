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
        className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-on-gold hover:bg-gold-hover"
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
      className="space-y-4 rounded-xl border border-line bg-surface p-6"
    >
      {error && (
        <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-text-2">Data</label>
          <input
            type="date"
            name="data"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
            className="w-full rounded-lg border border-line bg-hover px-3 py-2 text-text outline-none focus:border-gold"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-2">Valor (R$)</label>
          <input
            type="number"
            name="valor"
            step="0.01"
            min="0"
            defaultValue={valorSugerido}
            required
            className="w-full rounded-lg border border-line bg-hover px-3 py-2 text-text outline-none focus:border-gold tabular-nums"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm text-text-2">Observação</label>
        <input
          name="observacao"
          className="w-full rounded-lg border border-line bg-hover px-3 py-2 text-text outline-none focus:border-gold"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-on-gold hover:bg-gold-hover disabled:opacity-60"
        >
          {isPending ? "Salvando…" : "Registrar"}
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
  );
}
