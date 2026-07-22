"use client";

import { useState, useTransition } from "react";
import { createTipoEntrega, toggleTipoEntregaAtivo } from "@/app/actions/tiposEntrega";
import { formatDate } from "@/lib/format";
import type { TipoEntrega } from "@/lib/database.types";

export function TiposEntregaList({ tipos }: { tipos: TipoEntrega[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const ativos = tipos.filter((t) => t.ativo);
  const inativos = tipos.filter((t) => !t.ativo);

  return (
    <div className="space-y-6">
      <form
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            try {
              await createTipoEntrega(formData);
            } catch (e) {
              if (e instanceof Error) setError(e.message);
            }
          });
        }}
        className="flex gap-3"
      >
        <input
          name="nome"
          required
          placeholder="Nome do novo processo…"
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

      {error && (
        <div className="rounded-lg bg-status-alert-bg px-3 py-2 text-sm text-status-alert-text">
          {error}
        </div>
      )}

      <ul className="space-y-2">
        {ativos.map((t) => (
          <TipoItem key={t.id} tipo={t} />
        ))}
      </ul>

      {inativos.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-text-secondary">Desativados</p>
          <ul className="space-y-2">
            {inativos.map((t) => (
              <TipoItem key={t.id} tipo={t} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TipoItem({ tipo }: { tipo: TipoEntrega }) {
  const [isPending, startTransition] = useTransition();
  const [statusDesde, setStatusDesde] = useState(
    tipo.status_desde ?? new Date().toISOString().slice(0, 10)
  );

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-bg-surface-hover px-4 py-3 text-sm">
      <div>
        <span className={tipo.ativo ? "text-text-primary" : "text-text-secondary"}>
          {tipo.nome}
        </span>
        <span className="ml-2 text-xs text-text-secondary">
          {tipo.ativo ? "ativo" : "inativo"} desde {formatDate(statusDesde)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={statusDesde}
          disabled={isPending}
          onChange={(e) => setStatusDesde(e.target.value)}
          className="rounded-lg border border-border bg-bg-surface px-2 py-1 text-xs text-text-primary outline-none focus:border-accent"
        />
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(() =>
              toggleTipoEntregaAtivo(tipo.id, !tipo.ativo, statusDesde)
            )
          }
          className="whitespace-nowrap text-text-secondary hover:text-text-primary"
        >
          {tipo.ativo ? "Desativar" : "Reativar"}
        </button>
      </div>
    </li>
  );
}
