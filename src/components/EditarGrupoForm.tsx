"use client";

import { useState, useTransition } from "react";
import { updateGrupo } from "@/app/actions/grupos";
import type { GrupoGestao } from "@/lib/database.types";

const inputClass =
  "w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent";

export function EditarGrupoForm({ grupo }: { grupo: GrupoGestao }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="rounded-lg border border-border px-4 py-2 text-sm text-text-primary hover:bg-bg-surface-hover"
      >
        Editar
      </button>
    );
  }

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          await updateGrupo(grupo.id, formData);
          setEditing(false);
        })
      }
      className="space-y-4 rounded-xl border border-border bg-bg-surface p-6"
    >
      <div>
        <label className="mb-1 block text-sm text-text-secondary">Nome</label>
        <input name="nome" defaultValue={grupo.nome} required className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-text-secondary">Data de início</label>
          <input
            type="date"
            name="data_inicio"
            defaultValue={grupo.data_inicio}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-secondary">Valor mensal (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="valor_mensal"
            defaultValue={grupo.valor_mensal}
            required
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm text-text-secondary">Tráfego pago</label>
        <select name="trafego_pago" defaultValue={grupo.trafego_pago ?? ""} className={inputClass}>
          <option value="">—</option>
          <option value="SIM">SIM</option>
          <option value="NÃO">NÃO</option>
          <option value="PARADO">PARADO</option>
          <option value="EM IMPLEMENTAÇÃO">EM IMPLEMENTAÇÃO</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-text-secondary">Observações</label>
        <textarea
          name="observacoes"
          defaultValue={grupo.observacoes ?? ""}
          rows={3}
          className={inputClass}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {isPending ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-bg-surface-hover"
        >
          Cancelar edição
        </button>
      </div>
    </form>
  );
}
