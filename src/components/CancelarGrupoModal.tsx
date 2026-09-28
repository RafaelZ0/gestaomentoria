"use client";

import { useState, useTransition } from "react";
import { cancelarGrupo, reativarGrupo } from "@/app/actions/grupos";

export function CancelarGrupoButton({
  grupoId,
  status,
}: {
  grupoId: string;
  status: string;
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
        className="btn-secondary"
      >
        {isPending ? "Reativando…" : "Reativar grupo"}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-danger/40 px-4 py-2 text-sm text-danger hover:bg-danger/10"
      >
        Cancelar grupo
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6">
            <h2 className="font-display text-lg font-semibold text-text">
              Cancelar grupo
            </h2>
            <p className="mt-2 text-sm text-text-2">
              O contrato será marcado como encerrado. Se houver cláusula de
              cancelamento a cobrar, registre o pagamento manualmente (ou via
              Asaas) na aba Pagamentos do grupo.
            </p>

            <div className="mt-4">
              <label className="mb-1 block text-sm text-text-2">
                Data do cancelamento
              </label>
              <input
                type="date"
                value={dataCancelamento}
                onChange={(e) => setDataCancelamento(e.target.value)}
                className="w-full rounded-lg border border-line bg-hover px-3 py-2 text-sm text-text outline-none focus:border-gold"
              />
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await cancelarGrupo(grupoId, dataCancelamento);
                    setOpen(false);
                  })
                }
                className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-on-gold hover:bg-gold-hover disabled:opacity-60"
              >
                Confirmar cancelamento
              </button>
              <button
                disabled={isPending}
                onClick={() => setOpen(false)}
                className="btn-secondary"
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
