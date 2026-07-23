"use client";

import { useState, useTransition } from "react";
import { updateGrupoCampo } from "@/app/actions/grupos";

export function DataInicioField({
  grupoId,
  dataInicio,
}: {
  grupoId: string;
  dataInicio: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [valor, setValor] = useState(dataInicio);

  return (
    <span className="inline-flex items-center gap-1">
      Início do contrato em{" "}
      <input
        type="date"
        value={valor}
        disabled={isPending}
        onChange={(e) => {
          setValor(e.target.value);
          if (e.target.value) {
            startTransition(() =>
              updateGrupoCampo(grupoId, "data_inicio", e.target.value)
            );
          }
        }}
        className="rounded border border-transparent bg-transparent px-1 text-text-secondary outline-none hover:border-border focus:border-accent"
      />
    </span>
  );
}
