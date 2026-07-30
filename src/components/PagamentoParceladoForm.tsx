"use client";

import { useState, useTransition } from "react";
import { createPagamentoParcelado } from "@/app/actions/pagamentos";

export function PagamentoParceladoForm({ grupoId }: { grupoId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary text-sm">
        + Pagamento parcelado (cartão)
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const r = await createPagamentoParcelado(grupoId, formData);
          if (!r.ok) {
            setError(r.error);
            return;
          }
          setOpen(false);
        });
      }}
      className="space-y-4 rounded-xl border border-border bg-bg-surface p-6"
    >
      {error && (
        <div className="rounded-lg bg-status-alert-bg px-3 py-2 text-sm text-status-alert-text">
          {error}
        </div>
      )}
      <p className="text-xs text-text-secondary">
        Informe o valor total pago no cartão e a data da 1ª parcela — o
        sistema lança as 12 parcelas mensais automaticamente (valor total ÷
        12).
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-text-secondary">
            Valor total (R$)
          </label>
          <input
            type="number"
            name="valorTotal"
            step="0.01"
            min="0"
            required
            className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent tabular-nums"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-secondary">
            Data da 1ª parcela
          </label>
          <input
            type="date"
            name="dataInicial"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
            className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {isPending ? "Gerando…" : "Gerar 12 parcelas"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}
