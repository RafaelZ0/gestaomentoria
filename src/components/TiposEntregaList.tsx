"use client";

import { useState, useTransition } from "react";
import { createTipoEntrega, toggleTipoEntregaAtivo } from "@/app/actions/tiposEntrega";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import type { TipoEntrega } from "@/lib/database.types";

export function TiposEntregaList({ tipos }: { tipos: TipoEntrega[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
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

      <div className="overflow-x-auto rounded-xl border border-border bg-bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Ativo desde</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {tipos.map((t) => (
              <TipoRow key={t.id} tipo={t} />
            ))}
            {tipos.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">
                  Nenhum processo cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TipoRow({ tipo }: { tipo: TipoEntrega }) {
  const [isPending, startTransition] = useTransition();
  const [editandoData, setEditandoData] = useState(false);
  const [statusDesde, setStatusDesde] = useState(
    tipo.status_desde ?? new Date().toISOString().slice(0, 10)
  );

  function salvarData() {
    startTransition(async () => {
      await toggleTipoEntregaAtivo(tipo.id, tipo.ativo, statusDesde);
      setEditandoData(false);
    });
  }

  return (
    <tr className="border-b border-border last:border-0 hover:bg-bg-surface-hover">
      <td className="px-4 py-3 text-text-primary">{tipo.nome}</td>
      <td className="px-4 py-3">
        {editandoData ? (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={statusDesde}
              disabled={isPending}
              onChange={(e) => setStatusDesde(e.target.value)}
              className="rounded-lg border border-border bg-bg-surface-hover px-2 py-1 text-xs text-text-primary outline-none focus:border-accent"
            />
            <button
              type="button"
              disabled={isPending}
              onClick={salvarData}
              className="rounded-lg bg-accent px-2.5 py-1 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-60"
            >
              Salvar
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setStatusDesde(tipo.status_desde ?? new Date().toISOString().slice(0, 10));
                setEditandoData(false);
              }}
              className="btn-secondary px-2.5 py-1 text-xs"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="tabular-nums text-text-secondary">
              {formatDate(statusDesde)}
            </span>
            <button
              type="button"
              onClick={() => setEditandoData(true)}
              aria-label="Editar data"
              title="Editar data"
              className="text-text-secondary hover:text-text-primary"
            >
              ✎
            </button>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge label={tipo.ativo ? "Ativo" : "Inativo"} variant={tipo.ativo ? "ok" : "alert"} />
      </td>
      <td className="px-4 py-3 text-right">
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(() =>
              toggleTipoEntregaAtivo(tipo.id, !tipo.ativo, statusDesde)
            )
          }
          className={
            tipo.ativo
              ? "rounded-lg border border-status-alert-text/40 px-3 py-1.5 text-xs text-status-alert-text hover:bg-status-alert-bg disabled:opacity-60"
              : "btn-secondary px-3 py-1.5 text-xs"
          }
        >
          {tipo.ativo ? "Desativar" : "Reativar"}
        </button>
      </td>
    </tr>
  );
}
