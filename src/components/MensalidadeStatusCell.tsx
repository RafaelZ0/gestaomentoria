"use client";

import { useTransition } from "react";
import {
  marcarMensalidadePaga,
  desmarcarMensalidadePaga,
} from "@/app/actions/pagamentos";
import { StatusBadge } from "@/components/StatusBadge";

export function MensalidadeStatusCell({
  grupoId,
  dataVencimento,
  status,
}: {
  grupoId: string;
  dataVencimento: string;
  status: "Pago" | "Pendente" | "Atrasado";
}) {
  const [isPending, startTransition] = useTransition();

  const variant = status === "Pago" ? "ok" : status === "Atrasado" ? "alert" : "warn";

  return (
    <div className="flex items-center gap-2">
      <StatusBadge label={status} variant={variant} />
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(() =>
            status === "Pago"
              ? desmarcarMensalidadePaga(grupoId, dataVencimento)
              : marcarMensalidadePaga(grupoId, dataVencimento)
          )
        }
        className="text-xs text-text-secondary hover:text-text-primary disabled:opacity-60"
      >
        {status === "Pago" ? "Desfazer" : "Marcar como pago"}
      </button>
    </div>
  );
}
