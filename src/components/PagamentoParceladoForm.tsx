"use client";

import { useState, useTransition } from "react";
import { createPagamentoCartao } from "@/app/actions/pagamentos";
import { Modal } from "@/components/ui/Modal";

export function PagamentoParceladoForm({ grupoId }: { grupoId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary">
        Pagamento no cartão
      </button>

      {open && (
        <Modal titulo="Pagamento no cartão" onClose={() => setOpen(false)}>
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
            className="flex flex-col gap-4"
          >
            {error && <p className="text-sm text-danger">{error}</p>}
            <p className="text-[13px] text-muted">
              No cartão, o valor total entra de uma vez, no mês do pagamento — mesmo que o
              cliente tenha parcelado em 12x com a operadora do cartão.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="rotulo mb-1.5">Valor total (R$)</label>
                <input
                  type="number"
                  name="valorTotal"
                  step="0.01"
                  min="0"
                  required
                  className="campo tabular-nums"
                />
              </div>
              <div>
                <label className="rotulo mb-1.5">Data do pagamento</label>
                <input
                  type="date"
                  name="data"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  required
                  className="campo"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={isPending} className="btn-primary">
                {isPending ? "Registrando…" : "Registrar pagamento"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
