"use client";

import { useState } from "react";
import { formatBRL } from "@/lib/format";
import { DIAS_SEM_SINAL_DE_VIDA } from "@/lib/agendaStatus";
import { Metric } from "@/components/ui/Metric";
import { SaudeClientesPanel } from "@/components/SaudeClientesPanel";
import type { StatusSaude } from "@/lib/saude";

export function GruposResumo({
  totalPago,
  ativosCount,
  totalCount,
  semSinalDeVidaCount,
  saudeGrupos,
}: {
  totalPago: number;
  ativosCount: number;
  totalCount: number;
  semSinalDeVidaCount: number;
  saudeGrupos: { id: string; nome: string; status: StatusSaude; flags: string[] }[];
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 gap-x-10 gap-y-6 border-b border-line pb-7 sm:grid-cols-3">
        <Metric rotulo="Total recebido" tamanho="lg">
          {formatBRL(totalPago)}
        </Metric>
        <Metric rotulo="Grupos ativos" tamanho="lg">
          {ativosCount} <span className="text-base font-normal text-subtle">de {totalCount}</span>
        </Metric>
        <Metric
          rotulo={`Sem sinal de vida (+${DIAS_SEM_SINAL_DE_VIDA}d)`}
          tamanho="lg"
          tom={semSinalDeVidaCount > 0 ? "warn" : undefined}
        >
          {semSinalDeVidaCount}{" "}
          <button
            type="button"
            onClick={() => setAberto((a) => !a)}
            aria-expanded={aberto}
            className="link ml-1.5 align-middle text-[13px] font-normal tracking-normal"
          >
            {aberto ? "ocultar saúde dos clientes" : "ver saúde dos clientes"}
          </button>
        </Metric>
      </div>

      {aberto && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[15px] font-semibold text-text">Saúde dos clientes</h2>
          <p className="text-[13px] text-muted">
            Combina sinal de vida (+{DIAS_SEM_SINAL_DE_VIDA}d), tendência de ROAS entre os
            últimos dois meses com lançamento e processos ativos pendentes.
          </p>
          <SaudeClientesPanel grupos={saudeGrupos} />
        </section>
      )}
    </>
  );
}
