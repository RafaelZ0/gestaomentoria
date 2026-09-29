"use client";

import { useState, useTransition } from "react";
import { updateCustoHoraConfig } from "@/app/actions/custoHora";
import type { CustoHoraConfig } from "@/lib/database.types";

// Margem de segurança no padrão Editar → Salvar.
export function CustoHoraConfigForm({ config }: { config: CustoHoraConfig }) {
  const [isPending, startTransition] = useTransition();
  const [editando, setEditando] = useState(false);
  const atual = Number(config.percentual_fator_avaliacao);

  if (!editando) {
    return (
      <div className="flex items-baseline justify-between gap-6 border-b border-line-soft py-3 text-[14.5px]">
        <span className="text-muted">Margem de segurança</span>
        <span className="flex items-baseline gap-4">
          <span className="tabular-nums text-text">{atual.toLocaleString("pt-BR")}%</span>
          <button type="button" onClick={() => setEditando(true)} className="link text-[13.5px]">
            Editar
          </button>
        </span>
      </div>
    );
  }

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          await updateCustoHoraConfig(formData);
          setEditando(false);
        })
      }
      className="flex flex-wrap items-end gap-2 border-b border-line-soft py-3"
    >
      <div className="w-48">
        <label className="rotulo mb-1.5">Margem de segurança (%)</label>
        <input
          name="percentual_fator_avaliacao"
          type="number"
          step="0.01"
          min="0"
          autoFocus
          defaultValue={config.percentual_fator_avaliacao}
          className="campo tabular-nums"
        />
      </div>
      <button type="button" onClick={() => setEditando(false)} className="btn-secondary">
        Cancelar
      </button>
      <button type="submit" disabled={isPending} className="btn-secondary">
        {isPending ? "Salvando…" : "Salvar"}
      </button>
    </form>
  );
}
