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
      className="flex items-end gap-4"
    >
      <div className="max-w-xs flex-1">
        <label className="mb-1 block text-sm text-text-secondary">
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
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {isPending ? "Salvando…" : "Salvar"}
      </button>
    </form>
  );
}
