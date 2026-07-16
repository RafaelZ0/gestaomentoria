"use client";

import { useState, useTransition } from "react";
import {
  createCustoFixo,
  removeCustoFixo,
  updateCustoFixo,
} from "@/app/actions/custoHora";
import { formatBRL } from "@/lib/format";
import type { CustoFixo } from "@/lib/database.types";

const inputClass =
  "w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent";

export function CustosFixosList({ custos }: { custos: CustoFixo[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const total = custos.reduce((acc, c) => acc + Number(c.valor), 0);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-status-alert-bg px-3 py-2 text-sm text-status-alert-text">
          {error}
        </div>
      )}

      <ul className="space-y-2">
        {custos.map((c) => (
          <CustoFixoRow key={c.id} custo={c} />
        ))}
        {custos.length === 0 && (
          <p className="text-sm text-text-secondary">
            Nenhum custo fixo cadastrado ainda.
          </p>
        )}
      </ul>

      <div className="flex items-center justify-between rounded-lg border border-border bg-bg-surface-hover px-4 py-3 text-sm">
        <span className="text-text-secondary">Total de custos fixos</span>
        <span className="tabular-nums font-medium text-text-primary">
          {formatBRL(total)}
        </span>
      </div>

      <form
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            try {
              await createCustoFixo(formData);
            } catch (e) {
              if (e instanceof Error) setError(e.message);
            }
          });
        }}
        className="flex items-end gap-3"
      >
        <div className="flex-1">
          <label className="mb-1 block text-sm text-text-secondary">Nome</label>
          <input
            name="nome"
            required
            placeholder="Ex: Pró-labore"
            className={inputClass}
          />
        </div>
        <div className="w-40">
          <label className="mb-1 block text-sm text-text-secondary">Valor (R$)</label>
          <input
            name="valor"
            type="number"
            step="0.01"
            min="0"
            required
            className={`${inputClass} tabular-nums`}
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          Adicionar
        </button>
      </form>
    </div>
  );
}

function CustoFixoRow({ custo }: { custo: CustoFixo }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <li className="flex items-center justify-between rounded-lg border border-border bg-bg-surface-hover px-4 py-3 text-sm">
        <span className="text-text-primary">{custo.nome}</span>
        <div className="flex items-center gap-4">
          <span className="tabular-nums text-text-primary">
            {formatBRL(Number(custo.valor))}
          </span>
          <button
            onClick={() => setEditing(true)}
            className="text-text-secondary hover:text-text-primary"
          >
            Editar
          </button>
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(() => removeCustoFixo(custo.id))
            }
            className="text-text-secondary hover:text-status-alert-text"
          >
            Remover
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-border bg-bg-surface-hover px-4 py-3">
      {error && (
        <div className="mb-2 rounded-lg bg-status-alert-bg px-3 py-2 text-sm text-status-alert-text">
          {error}
        </div>
      )}
      <form
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            try {
              await updateCustoFixo(custo.id, formData);
              setEditing(false);
            } catch (e) {
              if (e instanceof Error) setError(e.message);
            }
          });
        }}
        className="flex items-end gap-3"
      >
        <div className="flex-1">
          <label className="mb-1 block text-sm text-text-secondary">Nome</label>
          <input
            name="nome"
            defaultValue={custo.nome}
            required
            className={inputClass}
          />
        </div>
        <div className="w-40">
          <label className="mb-1 block text-sm text-text-secondary">Valor (R$)</label>
          <input
            name="valor"
            type="number"
            step="0.01"
            min="0"
            defaultValue={custo.valor}
            required
            className={`${inputClass} tabular-nums`}
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-bg-surface-hover"
        >
          Cancelar
        </button>
      </form>
    </li>
  );
}
