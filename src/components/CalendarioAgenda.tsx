"use client";

import { useState } from "react";
import Link from "next/link";
import { blocosClinicaPablo } from "@/lib/disponibilidadePablo";
import { formatDiaSemanaCurto, formatDiaMesCurto, somarDias } from "@/lib/calendario";
import { AgendarSlotForm } from "@/components/AgendarSlotForm";
import { MiniCalendario } from "@/components/MiniCalendario";
import { AgendaResumo, type ProximaReuniao } from "@/components/AgendaResumo";
import type { GrupoParaAgendar } from "@/lib/agendaStatus";

export type ReuniaoDoDia = {
  id: string;
  hora: string | null;
  duracaoMin: number;
  grupoNome: string;
  responsavelId: string | null;
  responsavelNome: string | null;
  linkReuniao: string | null;
};

const HORA_INICIO_GRADE = 8;
const HORA_FIM_GRADE = 21;
const LINHAS_TOTAIS = (HORA_FIM_GRADE - HORA_INICIO_GRADE) * 2;
const ALTURA_LINHA = 28; // px

function minutosDoHorario(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function linhaDoHorario(hhmm: string): number {
  const minutos = minutosDoHorario(hhmm) - HORA_INICIO_GRADE * 60;
  return Math.floor(minutos / 30) + 1;
}

function linhasDeDuracao(minutos: number): number {
  return Math.max(1, Math.round(minutos / 30));
}

function horaDaLinha(indice: number): string {
  const minutos = HORA_INICIO_GRADE * 60 + indice * 30;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const HORAS_LABEL = Array.from(
  { length: HORA_FIM_GRADE - HORA_INICIO_GRADE },
  (_, i) => `${String(HORA_INICIO_GRADE + i).padStart(2, "0")}:00`
);

export function CalendarioAgenda({
  dias,
  reunioesPorDia,
  pabloId,
  grupos,
  hoje,
  miniAno,
  miniMes,
  proximas,
  paraAgendar,
}: {
  dias: string[];
  reunioesPorDia: Record<string, ReuniaoDoDia[]>;
  pabloId: string | null;
  grupos: { id: string; nome: string }[];
  hoje: string;
  miniAno: number;
  miniMes: number;
  proximas: ProximaReuniao[];
  paraAgendar: GrupoParaAgendar[];
}) {
  const [slotAberto, setSlotAberto] = useState<{ data: string; hora: string } | null>(
    null
  );

  const dataSelecionadaMini = dias[0] === hoje ? hoje : dias[0];

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="shrink-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
        <MiniCalendario
          ano={miniAno}
          mes={miniMes}
          dataSelecionada={dataSelecionadaMini}
          hoje={hoje}
        />
        <AgendaResumo proximas={proximas} paraAgendar={paraAgendar} />
      </div>

      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href={`/agenda?data=${somarDias(dias[0], -7)}`}
              prefetch={false}
              className="btn-secondary text-sm"
            >
              ‹
            </Link>
            <Link href="/agenda" prefetch={false} className="btn-secondary text-sm">
              Hoje
            </Link>
            <Link
              href={`/agenda?data=${somarDias(dias[0], 7)}`}
              prefetch={false}
              className="btn-secondary text-sm"
            >
              ›
            </Link>
          </div>
          <span className="text-sm text-text-secondary">
            {formatDiaMesCurto(dias[0])} — {formatDiaMesCurto(dias[6])}
          </span>
        </div>

        <p className="text-xs text-text-secondary">
          Dois cliques em qualquer intervalo de 30 min agenda uma reunião ali
          — mesmo em cima de um compromisso da clínica.
        </p>

        <div className="overflow-x-auto rounded-xl border border-border bg-bg-surface">
          <div
            className="grid min-w-[880px]"
            style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}
          >
            <div className="border-b border-r border-border" />
            {dias.map((d) => {
              const ehHoje = d === hoje;
              return (
                <div
                  key={d}
                  className={`border-b border-r border-border px-2 py-2 text-center last:border-r-0 ${
                    ehHoje ? "bg-bg-surface-hover" : ""
                  }`}
                >
                  <p className="text-xs text-text-secondary">
                    {formatDiaSemanaCurto(d)}
                  </p>
                  <p
                    className={`font-display text-sm font-semibold tabular-nums ${
                      ehHoje ? "text-accent" : "text-text-primary"
                    }`}
                  >
                    {formatDiaMesCurto(d)}
                  </p>
                </div>
              );
            })}

            <div
              className="relative border-r border-border"
              style={{
                gridColumn: 1,
                gridRow: `2 / span ${LINHAS_TOTAIS}`,
                display: "grid",
                gridTemplateRows: `repeat(${LINHAS_TOTAIS}, ${ALTURA_LINHA}px)`,
              }}
            >
              {HORAS_LABEL.map((h, i) => (
                <span
                  key={h}
                  className="border-t border-border px-1 text-right text-[10px] text-text-secondary"
                  style={{ gridRow: `${i * 2 + 1} / span 2` }}
                >
                  {h}
                </span>
              ))}
            </div>

            {dias.map((diaISO, colIdx) => {
              const reunioesDoDia = (reunioesPorDia[diaISO] ?? []).filter(
                (r) => r.hora
              );
              const blocos = blocosClinicaPablo(diaISO);
              const passou = diaISO < hoje;

              return (
                <div
                  key={diaISO}
                  className="relative border-r border-border last:border-r-0"
                  style={{
                    gridColumn: colIdx + 2,
                    gridRow: `2 / span ${LINHAS_TOTAIS}`,
                    display: "grid",
                    gridTemplateRows: `repeat(${LINHAS_TOTAIS}, ${ALTURA_LINHA}px)`,
                  }}
                >
                  {Array.from({ length: LINHAS_TOTAIS }, (_, i) => (
                    <div
                      key={i}
                      role={pabloId && !passou ? "button" : undefined}
                      onDoubleClick={() => {
                        if (!pabloId || passou) return;
                        setSlotAberto({ data: diaISO, hora: horaDaLinha(i) });
                      }}
                      className={`border-t border-border/60 ${
                        pabloId && !passou ? "cursor-pointer hover:bg-accent/10" : ""
                      }`}
                      style={{ gridRow: i + 1 }}
                    />
                  ))}

                  {blocos
                    .filter(
                      (b) =>
                        minutosDoHorario(b.inicio) >= HORA_INICIO_GRADE * 60 &&
                        minutosDoHorario(b.fim) <= HORA_FIM_GRADE * 60
                    )
                    .map((b, i) => (
                      <div
                        key={`bloco-${i}`}
                        className="pointer-events-none m-0.5 overflow-hidden rounded border border-border bg-bg-surface-hover px-1.5 py-1 text-[10px] font-medium leading-tight text-text-primary"
                        style={{
                          gridRow: `${linhaDoHorario(b.inicio)} / span ${linhasDeDuracao(minutosDoHorario(b.fim) - minutosDoHorario(b.inicio))}`,
                        }}
                        title={b.label}
                      >
                        {b.label}
                      </div>
                    ))}

                  {reunioesDoDia.map((r) => {
                    const hora = r.hora!.slice(0, 5);
                    return (
                      <div
                        key={r.id}
                        className="m-0.5 overflow-hidden rounded bg-status-accent-bg px-1.5 py-1 text-[10px] font-medium text-status-accent-text"
                        style={{
                          gridRow: `${linhaDoHorario(hora)} / span ${linhasDeDuracao(r.duracaoMin)}`,
                        }}
                        title={`${hora} ${r.grupoNome}${r.responsavelNome ? ` — ${r.responsavelNome}` : ""}`}
                      >
                        {hora} {r.grupoNome}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {slotAberto && pabloId && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={() => setSlotAberto(null)}
          >
            <div
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <AgendarSlotForm
                data={slotAberto.data}
                hora={slotAberto.hora}
                pabloId={pabloId}
                grupos={grupos}
                onCancel={() => setSlotAberto(null)}
                onAgendado={() => setSlotAberto(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
