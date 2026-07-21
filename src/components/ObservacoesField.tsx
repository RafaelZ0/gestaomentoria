"use client";

import { useState, useTransition } from "react";
import { updateGrupoCampo } from "@/app/actions/grupos";

export function ObservacoesField({
  grupoId,
  observacoes,
}: {
  grupoId: string;
  observacoes: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [valor, setValor] = useState(observacoes ?? "");

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-5">
      <p className="text-sm text-text-secondary">Observações</p>
      <textarea
        value={valor}
        disabled={isPending}
        placeholder="Sem observações"
        rows={2}
        onChange={(e) => setValor(e.target.value)}
        onBlur={() => {
          if (valor !== (observacoes ?? "")) {
            startTransition(() => updateGrupoCampo(grupoId, "observacoes", valor));
          }
        }}
        className="mt-1 w-full resize-none bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
      />
    </div>
  );
}
