"use client";

import { useState, useTransition } from "react";
import {
  createTarefa,
  toggleTarefa,
  updateTarefa,
  removeTarefa,
} from "@/app/actions/tarefas";
import { ResponsavelField } from "@/components/ResponsavelField";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";
import type { Tarefa, Responsavel, PrioridadeTarefa } from "@/lib/database.types";

const PRIORIDADE_VARIANT: Record<PrioridadeTarefa, "alert" | "warn" | "neutral"> = {
  Alta: "alert",
  Média: "warn",
  Baixa: "neutral",
};

export function TarefasList({
  grupoId,
  tarefas,
  responsaveis,
}: {
  grupoId: string;
  tarefas: Tarefa[];
  responsaveis: Responsavel[];
}) {
  const [isPending, startTransition] = useTransition();

  const pendentes = tarefas.filter((t) => !t.concluida);
  const concluidas = tarefas.filter((t) => t.concluida);

  const responsavelPorId = new Map(responsaveis.map((r) => [r.id, r.nome]));

  return (
    <div className="space-y-6">
      <form
        action={(formData) =>
          startTransition(async () => {
            await createTarefa(grupoId, formData);
          })
        }
        className="space-y-3 rounded-xl border border-border bg-bg-surface p-4"
      >
        <input
          name="descricao"
          required
          placeholder="Nova tarefa…"
          className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-text-secondary">Prazo</label>
            <input
              type="date"
              name="prazo"
              className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-secondary">
              Prioridade
            </label>
            <select
              name="prioridade"
              defaultValue="Média"
              className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-sm text-text-primary"
            >
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
            </select>
          </div>
          <ResponsavelField responsaveis={responsaveis} label="Responsável" />
        </div>
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
          <TarefaItem
            key={t.id}
            grupoId={grupoId}
            tarefa={t}
            responsaveis={responsaveis}
            responsavelNome={
              t.responsavel_id ? responsavelPorId.get(t.responsavel_id) : undefined
            }
          />
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
              <TarefaItem
                key={t.id}
                grupoId={grupoId}
                tarefa={t}
                responsaveis={responsaveis}
                responsavelNome={
                  t.responsavel_id ? responsavelPorId.get(t.responsavel_id) : undefined
                }
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TarefaItem({
  grupoId,
  tarefa,
  responsaveis,
  responsavelNome,
}: {
  grupoId: string;
  tarefa: Tarefa;
  responsaveis: Responsavel[];
  responsavelNome: string | undefined;
}) {
  const [isPending, startTransition] = useTransition();
  const [editando, setEditando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hoje = new Date().toISOString().slice(0, 10);
  const atrasada = !tarefa.concluida && !!tarefa.prazo && tarefa.prazo < hoje;

  if (editando) {
    return (
      <li className="rounded-lg border border-border bg-bg-surface-hover px-4 py-3">
        {error && (
          <p className="mb-2 text-xs text-status-alert-text">{error}</p>
        )}
        <form
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              try {
                await updateTarefa(grupoId, tarefa.id, formData);
                setEditando(false);
              } catch (e) {
                if (e instanceof Error) setError(e.message);
              }
            });
          }}
          className="space-y-3"
        >
          <input
            name="descricao"
            required
            defaultValue={tarefa.descricao}
            className="w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-text-secondary">
                Prazo
              </label>
              <input
                type="date"
                name="prazo"
                defaultValue={tarefa.prazo ?? ""}
                className="w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-secondary">
                Prioridade
              </label>
              <select
                name="prioridade"
                defaultValue={tarefa.prioridade}
                className="w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary"
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
            <ResponsavelField
              responsaveis={responsaveis}
              defaultResponsavelId={tarefa.responsavel_id ?? ""}
              label="Responsável"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-60"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              Cancelar
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3 rounded-lg border border-border bg-bg-surface-hover px-4 py-3">
      <input
        type="checkbox"
        checked={tarefa.concluida}
        disabled={isPending}
        onChange={(e) =>
          startTransition(() =>
            toggleTarefa(grupoId, tarefa.id, e.target.checked)
          )
        }
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
      />
      <div
        className="flex-1 cursor-pointer"
        onClick={() => setEditando(true)}
      >
        <span
          className={`text-sm ${
            tarefa.concluida ? "text-text-secondary line-through" : "text-text-primary"
          }`}
        >
          {tarefa.descricao}
        </span>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <StatusBadge
            label={tarefa.prioridade}
            variant={PRIORIDADE_VARIANT[tarefa.prioridade]}
          />
          {tarefa.prazo && (
            <span
              className={`text-xs tabular-nums ${
                atrasada ? "text-status-alert-text" : "text-text-secondary"
              }`}
            >
              {atrasada ? "Atrasada — " : "Prazo: "}
              {formatDate(tarefa.prazo)}
            </span>
          )}
          {responsavelNome && (
            <span className="text-xs text-text-secondary">{responsavelNome}</span>
          )}
        </div>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={(e) => {
          e.stopPropagation();
          if (!confirm("Remover esta tarefa?")) return;
          startTransition(() => removeTarefa(grupoId, tarefa.id));
        }}
        className="shrink-0 text-xs text-text-secondary hover:text-status-alert-text disabled:opacity-60"
      >
        Remover
      </button>
    </li>
  );
}
