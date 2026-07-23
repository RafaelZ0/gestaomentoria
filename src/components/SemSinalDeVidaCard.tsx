"use client";

import { useState } from "react";
import Link from "next/link";

type GrupoAtrasado = { id: string; nome: string; dias: number | null };

export function SemSinalDeVidaCard({
  dias,
  grupos,
}: {
  dias: number;
  grupos: GrupoAtrasado[];
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-6">
      <button
        type="button"
        onClick={() => grupos.length > 0 && setAberto((a) => !a)}
        disabled={grupos.length === 0}
        className="w-full text-left disabled:cursor-default"
      >
        <p className="text-sm text-text-secondary">
          Sem sinal de vida (+{dias}d)
        </p>
        <div className="mt-2 flex items-center gap-2">
          <p
            className={`font-display text-2xl font-semibold tracking-tight tabular-nums ${
              grupos.length > 0 ? "text-status-warn-text" : "text-text-primary"
            }`}
          >
            {grupos.length}
          </p>
          {grupos.length > 0 && (
            <span className="text-xs text-text-secondary">
              {aberto ? "▲ ocultar" : "▼ ver quais"}
            </span>
          )}
        </div>
      </button>

      {aberto && grupos.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-border pt-4">
          {grupos.map((g) => (
            <li key={g.id}>
              <Link
                href={`/grupos/${g.id}`}
                prefetch={false}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-bg-surface-hover"
              >
                <span className="text-text-primary">{g.nome}</span>
                <span className="text-status-warn-text">
                  {g.dias === null
                    ? "nunca teve reunião"
                    : `${g.dias} dias atrás`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
