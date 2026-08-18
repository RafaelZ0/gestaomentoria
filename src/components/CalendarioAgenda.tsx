"use client";

import { useState } from "react";
import Link from "next/link";
import { horariosPablo } from "@/lib/disponibilidadePablo";
import { formatDate } from "@/lib/format";
import { AgendarSlotForm } from "@/components/AgendarSlotForm";

export type ReuniaoDoDia = {
  id: string;
  hora: string | null;
  grupoNome: string;
  responsavelId: string | null;
  responsavelNome: string | null;
  linkReuniao: string | null;
};

const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function CalendarioAgenda({
  semanas,
  mesAtual,
  reunioesPorDia,
  pabloId,
  grupos,
  tituloMes,
  hrefMesAnterior,
  hrefProximoMes,
  hoje,
}: {
  semanas: string[][];
  mesAtual: number; // 1-12
  reunioesPorDia: Record<string, ReuniaoDoDia[]>;
  pabloId: string | null;
  grupos: { id: string; nome: string }[];
  tituloMes: string;
  hrefMesAnterior: string;
  hrefProximoMes: string;
  hoje: string;
}) {
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [slotEscolhido, setSlotEscolhido] = useState<string | null>(null);

  const reunioesDoDiaSelecionado = diaSelecionado
    ? (reunioesPorDia[diaSelecionado] ?? [])
    : [];
  const ocupadosPablo = new Set(
    reunioesDoDiaSelecionado
      .filter((r) => r.responsavelId === pabloId && r.hora)
      .map((r) => r.hora!.slice(0, 5))
  );
  const slotsDoDiaSelecionado = diaSelecionado
    ? horariosPablo(diaSelecionado)
    : [];
  const disponiveis = slotsDoDiaSelecionado.filter((h) => !ocupadosPablo.has(h));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href={hrefMesAnterior} prefetch={false} className="btn-secondary text-sm">
          ← Anterior
        </Link>
        <h2 className="font-display text-lg font-semibold text-text-primary">
          {tituloMes}
        </h2>
        <Link href={hrefProximoMes} prefetch={false} className="btn-secondary text-sm">
          Próximo →
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-bg-surface">
        <div className="grid min-w-[720px] grid-cols-6 border-b border-border text-xs font-medium text-text-secondary">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="px-3 py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid min-w-[720px] grid-cols-6">
          {semanas.flat().map((diaISO) => {
            const [ano, mes, dia] = diaISO.split("-").map(Number);
            const foraDoMes = mes !== mesAtual;
            const ehHoje = diaISO === hoje;
            const reunioesDoDia = reunioesPorDia[diaISO] ?? [];
            const totalSlotsPablo = horariosPablo(diaISO).length;
            const ocupadosPabloAqui = reunioesDoDia.filter(
              (r) => r.responsavelId === pabloId
            ).length;
            const livresPablo = Math.max(totalSlotsPablo - ocupadosPabloAqui, 0);

            return (
              <button
                key={diaISO}
                type="button"
                onClick={() => {
                  setDiaSelecionado(diaISO);
                  setSlotEscolhido(null);
                }}
                className={`flex min-h-[86px] flex-col items-start gap-1 border-b border-r border-border p-2 text-left text-xs last:border-r-0 hover:bg-bg-surface-hover ${
                  foraDoMes ? "text-text-secondary/50" : "text-text-primary"
                } ${diaSelecionado === diaISO ? "bg-bg-surface-hover ring-1 ring-inset ring-accent" : ""}`}
              >
                <span
                  className={`tabular-nums ${
                    ehHoje
                      ? "rounded-full bg-accent px-1.5 py-0.5 text-white"
                      : ""
                  }`}
                >
                  {dia}
                </span>
                {reunioesDoDia.slice(0, 2).map((r) => (
                  <span
                    key={r.id}
                    className="w-full truncate rounded bg-status-accent-bg px-1 py-0.5 text-[10px] text-status-accent-text"
                  >
                    {r.hora?.slice(0, 5) ?? "—"} {r.grupoNome}
                  </span>
                ))}
                {reunioesDoDia.length > 2 && (
                  <span className="text-[10px] text-text-secondary">
                    +{reunioesDoDia.length - 2}
                  </span>
                )}
                {pabloId && totalSlotsPablo > 0 && (
                  <span
                    className={`mt-auto text-[10px] ${
                      livresPablo > 0
                        ? "text-status-ok-text"
                        : "text-text-secondary"
                    }`}
                  >
                    {livresPablo > 0
                      ? `${livresPablo} livre${livresPablo > 1 ? "s" : ""}`
                      : "Pablo lotado"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {diaSelecionado && (
        <div className="rounded-xl border border-border bg-bg-surface p-5">
          <h3 className="font-display text-sm font-semibold text-text-primary">
            {formatDate(diaSelecionado)}
          </h3>

          <div className="mt-3">
            <p className="text-xs font-medium text-text-secondary">
              Reuniões marcadas
            </p>
            {reunioesDoDiaSelecionado.length === 0 ? (
              <p className="mt-1 text-sm text-text-secondary">
                Nenhuma reunião neste dia.
              </p>
            ) : (
              <ul className="mt-2 space-y-1">
                {reunioesDoDiaSelecionado
                  .slice()
                  .sort((a, b) => (a.hora ?? "").localeCompare(b.hora ?? ""))
                  .map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-sm"
                    >
                      <span className="text-text-primary">
                        {r.hora?.slice(0, 5) ?? "sem horário"} — {r.grupoNome}
                        {r.responsavelNome && (
                          <span className="ml-2 text-xs text-text-secondary">
                            ({r.responsavelNome})
                          </span>
                        )}
                      </span>
                      {r.linkReuniao && (
                        <a
                          href={r.linkReuniao}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-accent hover:text-accent-hover"
                        >
                          Link
                        </a>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {pabloId && diaISOMaiorOuIgualHoje(diaSelecionado, hoje) && (
            <div className="mt-4">
              <p className="text-xs font-medium text-text-secondary">
                Horários livres do Pablo
              </p>
              {disponiveis.length === 0 ? (
                <p className="mt-1 text-sm text-text-secondary">
                  Nenhum horário livre nesse dia pela grade do Pablo.
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {disponiveis.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setSlotEscolhido(h)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                        slotEscolhido === h
                          ? "border-accent bg-accent text-white"
                          : "border-border text-text-primary hover:bg-bg-surface-hover"
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              )}

              {slotEscolhido && (
                <div className="mt-3">
                  <AgendarSlotForm
                    data={diaSelecionado}
                    hora={slotEscolhido}
                    pabloId={pabloId}
                    grupos={grupos}
                    onCancel={() => setSlotEscolhido(null)}
                    onAgendado={() => setSlotEscolhido(null)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function diaISOMaiorOuIgualHoje(diaISO: string, hoje: string): boolean {
  return diaISO >= hoje;
}
