"use client";

import { useState, useTransition } from "react";
import { cancelarGrupo, reativarGrupo } from "@/app/actions/grupos";
import { formatBRL } from "@/lib/format";

export function CancelarGrupoButton({
  grupoId,
  status,
  valorMensal,
}: {
  grupoId: string;
  status: string;
  valorMensal: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [dataCancelamento, setDataCancelamento] = useState(
    new Date().toISOString().slice(0, 10)
  );

  if (status === "Inativo") {
    return (
      <button
        onClick={() =>
          startTransition(() => {
            reativarGrupo(grupoId);
          })
        }
        disabled={isPending}
        className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-bg-surface-hover disabled:opacity-60"
      >
        {isPending ? "Reativando…" : "Reativar grupo"}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-status-alert-text/40 px-4 py-2 text-sm text-status-alert-text hover:bg-status-alert-bg"
      >
        Cancelar grupo
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-bg-surface p-6">
            <h2 className="font-display text-lg font-semibold text-text-primary">
              Cancelar grupo
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Este cancelamento se enquadra na cláusula de cancelamento
              (pagamento de +1 parcela além do que já foi pago)?
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Se sim, um pagamento extra de{" "}
              <span className="tabular-nums text-text-primary">
                {formatBRL(valorMensal)}
              </span>{" "}
              será registrado automaticamente.
            </p>

            <div className="mt-4">
              <label className="mb-1 block text-sm text-text-secondary">
                Data do cancelamento
              </label>
              <input
                type="date"
                value={dataCancelamento}
                onChange={(e) => setDataCancelamento(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
              />
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await cancelarGrupo(grupoId, true, dataCancelamento);
                    setOpen(false);
                  })
                }
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
              >
                Sim, aplicar cláusula e cancelar
              </button>
              <button
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await cancelarGrupo(grupoId, false, dataCancelamento);
                    setOpen(false);
                  })
                }
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-primary hover:bg-bg-surface-hover disabled:opacity-60"
              >
                Não, cancelar sem cláusula
              </button>
              <button
                disabled={isPending}
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
