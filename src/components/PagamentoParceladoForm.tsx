"use client";

import { useState, useTransition } from "react";
import { createPagamentoCartao } from "@/app/actions/pagamentos";

export function PagamentoParceladoForm({ grupoId }: { grupoId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary text-sm">
        + Pagamento no cartão
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const r = await createPagamentoCartao(grupoId, formData);
          if (!r.ok) {
            setError(r.error);
            return;
          }
          setOpen(false);
        });
      }}
      className="space-y-4 rounded-xl border border-line bg-surface p-6"
    >
      {error && (
        <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}
      <p className="text-xs text-text-2">
        No cartão, o valor total entra de uma vez, no mês do pagamento —
        mesmo que o cliente tenha parcelado em 12x com a operadora do cartão.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-text-2">
            Valor total (R$)
          </label>
          <input
            type="number"
            name="valorTotal"
            step="0.01"
            min="0"
            required
            className="w-full rounded-lg border border-line bg-hover px-3 py-2 text-text outline-none focus:border-gold tabular-nums"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-2">
            Data do pagamento
          </label>
          <input
            type="date"
            name="data"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
            className="w-full rounded-lg border border-line bg-hover px-3 py-2 text-text outline-none focus:border-gold"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-on-gold hover:bg-gold-hover disabled:opacity-60"
        >
          {isPending ? "Registrando…" : "Registrar pagamento"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}
