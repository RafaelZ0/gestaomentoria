"use client";

import { useState, useTransition } from "react";
import { addMentorado, removeMentorado } from "@/app/actions/grupos";
import type { Mentorado } from "@/lib/database.types";

export function MentoradosList({
  grupoId,
  mentorados,
}: {
  grupoId: string;
  mentorados: Mentorado[];
}) {
  const [adding, setAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      {mentorados.length === 0 && !adding && (
        <p className="text-sm text-text-secondary">Nenhum mentorado cadastrado.</p>
      )}
      <ul className="space-y-2">
        {mentorados.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between rounded-lg border border-border bg-bg-surface-hover px-4 py-3 text-sm"
          >
            <div>
              <span className="text-text-primary">{m.nome}</span>
              {m.telefone && (
                <span className="ml-2 text-text-secondary">{m.telefone}</span>
              )}
            </div>
            <button
              disabled={isPending}
              onClick={() =>
                startTransition(() => removeMentorado(grupoId, m.id))
              }
              className="text-text-secondary hover:text-status-alert-text"
            >
              Remover
            </button>
          </li>
        ))}
      </ul>

      {adding ? (
        <form
          action={(formData) =>
            startTransition(async () => {
              await addMentorado(grupoId, formData);
              setAdding(false);
            })
          }
          className="flex items-end gap-3"
        >
          <div className="flex-1">
            <label className="mb-1 block text-sm text-text-secondary">Nome</label>
            <input
              name="nome"
              required
              className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm text-text-secondary">Telefone</label>
            <input
              name="telefone"
              className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
          >
            Adicionar
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-bg-surface-hover"
          >
            Cancelar
          </button>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="text-sm text-accent hover:text-accent-hover"
        >
          + Adicionar mentorado
        </button>
      )}
    </div>
  );
}
