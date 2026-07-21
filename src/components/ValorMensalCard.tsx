"use client";

import { useState, useTransition } from "react";
import { updateGrupoCampo } from "@/app/actions/grupos";

export function ValorMensalCard({
  grupoId,
  valorMensal,
}: {
  grupoId: string;
  valorMensal: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [valor, setValor] = useState(String(valorMensal));

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-5">
      <p className="text-sm text-text-secondary">Valor mensal</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-display text-xl font-semibold text-text-primary">
          R$
        </span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={valor}
          disabled={isPending}
          onChange={(e) => setValor(e.target.value)}
          onBlur={() => {
            if (valor && Number(valor) !== valorMensal) {
              startTransition(() =>
                updateGrupoCampo(grupoId, "valor_mensal", valor)
              );
            }
          }}
          className="w-full min-w-0 bg-transparent font-display text-xl font-semibold tabular-nums text-text-primary outline-none focus:border-b focus:border-accent"
        />
      </div>
    </div>
  );
}
