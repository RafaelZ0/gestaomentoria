"use client";

import { useTransition } from "react";
import { updateCustoHoraConfig } from "@/app/actions/custoHora";
import type { CustoHoraConfig } from "@/lib/database.types";

const inputClass =
  "w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent tabular-nums";

export function CustoHoraConfigForm({ config }: { config: CustoHoraConfig }) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(() => updateCustoHoraConfig(formData))
      }
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
    >
      <div>
        <label className="mb-1 block text-sm text-text-secondary">
          Horas de atendimento/mês
        </label>
        <input
          name="horas_atendimento_mes"
          type="number"
          step="0.01"
          min="0"
          defaultValue={config.horas_atendimento_mes}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-text-secondary">
          % Ociosidade
        </label>
        <input
          name="percentual_ociosidade"
          type="number"
          step="0.01"
          min="0"
          max="100"
          defaultValue={config.percentual_ociosidade}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-text-secondary">
          % Fator de avaliação
        </label>
        <input
          name="percentual_fator_avaliacao"
          type="number"
          step="0.01"
          min="0"
          defaultValue={config.percentual_fator_avaliacao}
          className={inputClass}
        />
      </div>
      <div className="sm:col-span-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {isPending ? "Salvando…" : "Salvar parâmetros"}
        </button>
      </div>
    </form>
  );
}
