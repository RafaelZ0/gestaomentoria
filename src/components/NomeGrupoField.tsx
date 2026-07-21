"use client";

import { useState, useTransition } from "react";
import { updateGrupoCampo } from "@/app/actions/grupos";

export function NomeGrupoField({
  grupoId,
  nome,
}: {
  grupoId: string;
  nome: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [valor, setValor] = useState(nome);

  return (
    <input
      value={valor}
      disabled={isPending}
      onChange={(e) => setValor(e.target.value)}
      onBlur={() => {
        if (valor.trim() && valor !== nome) {
          startTransition(() => updateGrupoCampo(grupoId, "nome", valor.trim()));
        } else {
          setValor(nome);
        }
      }}
      className="min-w-0 flex-1 bg-transparent font-display text-2xl font-semibold text-text-primary outline-none focus:border-b focus:border-accent"
    />
  );
}
