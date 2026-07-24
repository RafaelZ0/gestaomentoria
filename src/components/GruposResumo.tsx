"use client";

import { useState } from "react";
import { formatBRL } from "@/lib/format";
import { SaudeClientesPanel } from "@/components/SaudeClientesPanel";
import type { StatusSaude } from "@/lib/saude";

const DIAS_SEM_SINAL_DE_VIDA = 30;

export function GruposResumo({
  faturamentoTotal,
  ativosCount,
  totalCount,
  semSinalDeVidaCount,
  saudeGrupos,
}: {
  faturamentoTotal: number;
  ativosCount: number;
  totalCount: number;
  semSinalDeVidaCount: number;
  saudeGrupos: { id: string; nome: string; status: StatusSaude; flags: string[] }[];
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-hero rounded-xl border border-border bg-bg-surface p-6 sm:col-span-1">
          <p className="text-sm text-text-secondary">Faturamento total (estimado)</p>
          <p className="mt-2 font-display text-4xl font-bold tracking-tight tabular-nums text-text-primary">
            {formatBRL(faturamentoTotal)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg-surface p-6">
          <p className="text-sm text-text-secondary">Grupos ativos</p>
          <p className="mt-2 font-display text-2xl font-semibold tracking-tight tabular-nums text-text-primary">
            {ativosCount}{" "}
            <span className="text-base font-normal text-text-secondary">
              / {totalCount}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAberto((a) => !a)}
          className="rounded-xl border border-border bg-bg-surface p-6 text-left"
        >
          <p className="text-sm text-text-secondary">
            Sem sinal de vida (+{DIAS_SEM_SINAL_DE_VIDA}d)
          </p>
          <div className="mt-2 flex items-center gap-2">
            <p
              className={`font-display text-2xl font-semibold tracking-tight tabular-nums ${
                semSinalDeVidaCount > 0 ? "text-status-warn-text" : "text-text-primary"
              }`}
            >
              {semSinalDeVidaCount}
            </p>
            <span className="text-xs text-text-secondary">
              {aberto ? "▲ ocultar" : "▼ ver saúde dos clientes"}
            </span>
          </div>
        </button>
      </div>

      {aberto && (
        <div className="mt-8">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Saúde dos clientes
          </h2>
          <p className="mt-1 text-xs text-text-secondary">
            Combina sinal de vida (+{DIAS_SEM_SINAL_DE_VIDA}d), tendência de
            ROAS entre os últimos dois meses com lançamento e processos
            ativos pendentes.
          </p>
          <div className="mt-3">
            <SaudeClientesPanel grupos={saudeGrupos} />
          </div>
        </div>
      )}
    </>
  );
}
