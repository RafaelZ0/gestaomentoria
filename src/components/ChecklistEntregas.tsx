"use client";

import { useTransition } from "react";
import { toggleEntrega, updateEntregaData } from "@/app/actions/entregas";

export interface EntregaItem {
  id: string;
  nome: string;
  feito: boolean;
  data_feito: string | null;
}

export function ChecklistEntregas({
  grupoId,
  entregas,
}: {
  grupoId: string;
  entregas: EntregaItem[];
}) {
  const [isPending, startTransition] = useTransition();

  if (entregas.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        Nenhum tipo de entrega cadastrado ainda.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {entregas.map((e) => (
        <li
          key={e.id}
          className="flex items-center justify-between rounded-lg border border-border bg-bg-surface-hover px-4 py-3"
        >
          <label className="flex items-center gap-3 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={e.feito}
              disabled={isPending}
              onChange={(ev) =>
                startTransition(() =>
                  toggleEntrega(grupoId, e.id, ev.target.checked)
                )
              }
              className="h-4 w-4 accent-[var(--accent)]"
            />
            {e.nome}
          </label>
          {e.feito && (
            <input
              type="date"
              value={e.data_feito ?? ""}
              disabled={isPending}
              onChange={(ev) =>
                startTransition(() =>
                  updateEntregaData(grupoId, e.id, ev.target.value)
                )
              }
              className="rounded-lg border border-border bg-bg-surface px-2 py-1 text-xs text-text-secondary outline-none focus:border-accent tabular-nums"
            />
          )}
        </li>
      ))}
    </ul>
  );
}
