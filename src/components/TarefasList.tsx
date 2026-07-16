"use client";

import { useTransition } from "react";
import { createTarefa, toggleTarefa } from "@/app/actions/tarefas";
import type { Tarefa } from "@/lib/database.types";

export function TarefasList({
  grupoId,
  tarefas,
}: {
  grupoId: string;
  tarefas: Tarefa[];
}) {
  const [isPending, startTransition] = useTransition();

  const pendentes = tarefas.filter((t) => !t.concluida);
  const concluidas = tarefas.filter((t) => t.concluida);

  return (
    <div className="space-y-6">
      <form
        action={(formData) =>
          startTransition(async () => {
            await createTarefa(grupoId, formData);
          })
        }
        className="flex gap-3"
      >
        <input
          name="descricao"
          required
          placeholder="Nova tarefa…"
          className="flex-1 rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          Adicionar
        </button>
      </form>

      <ul className="space-y-2">
        {pendentes.map((t) => (
          <TarefaItem key={t.id} grupoId={grupoId} tarefa={t} />
        ))}
        {tarefas.length === 0 && (
          <p className="text-sm text-text-secondary">Nenhuma tarefa cadastrada.</p>
        )}
      </ul>

      {concluidas.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-text-secondary">Concluídas</p>
          <ul className="space-y-2">
            {concluidas.map((t) => (
              <TarefaItem key={t.id} grupoId={grupoId} tarefa={t} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TarefaItem({ grupoId, tarefa }: { grupoId: string; tarefa: Tarefa }) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-bg-surface-hover px-4 py-3">
      <input
        type="checkbox"
        checked={tarefa.concluida}
        disabled={isPending}
        onChange={(e) =>
          startTransition(() =>
            toggleTarefa(grupoId, tarefa.id, e.target.checked)
          )
        }
        className="h-4 w-4 accent-[var(--accent)]"
      />
      <span
        className={`text-sm ${
          tarefa.concluida ? "text-text-secondary line-through" : "text-text-primary"
        }`}
      >
        {tarefa.descricao}
      </span>
    </li>
  );
}
