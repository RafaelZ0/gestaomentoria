"use client";

import { useState, useTransition } from "react";
import { createPagamento } from "@/app/actions/pagamentos";
import { Modal } from "@/components/ui/Modal";

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

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary">
        Registrar pagamento
      </button>

      {open && (
        <Modal titulo="Registrar pagamento" onClose={() => setOpen(false)}>
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
            className="flex flex-col gap-4"
          >
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="rotulo mb-1.5">Data</label>
                <input
                  type="date"
                  name="data"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  required
                  className="campo"
                />
              </div>
              <div>
                <label className="rotulo mb-1.5">Valor (R$)</label>
                <input
                  type="number"
                  name="valor"
                  step="0.01"
                  min="0"
                  defaultValue={valorSugerido}
                  required
                  className="campo tabular-nums"
                />
              </div>
            </div>
            <div>
              <label className="rotulo mb-1.5">Observação</label>
              <input name="observacao" className="campo" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={isPending} className="btn-primary">
                {isPending ? "Salvando…" : "Registrar"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
