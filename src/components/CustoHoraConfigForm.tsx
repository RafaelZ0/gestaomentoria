"use client";

import { useTransition } from "react";
import { updateCustoHoraConfig } from "@/app/actions/custoHora";
import type { CustoHoraConfig } from "@/lib/database.types";

const inputClass =
  "w-full rounded-lg border border-line bg-hover px-3 py-2 text-text outline-none focus:border-gold tabular-nums";

export function CustoHoraConfigForm({ config }: { config: CustoHoraConfig }) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(() => updateCustoHoraConfig(formData))
      }
      className="flex items-end gap-4"
    >
      <div className="max-w-xs flex-1">
        <label className="mb-1 block text-sm text-text-2">
          Margem de segurança (%)
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
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-on-gold hover:bg-gold-hover disabled:opacity-60"
      >
        {isPending ? "Salvando…" : "Salvar"}
      </button>
    </form>
  );
}
