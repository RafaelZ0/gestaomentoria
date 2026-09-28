"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { blocosClinicaPablo } from "@/lib/disponibilidadePablo";
import { formatDiaSemanaCurto, formatDiaMesCurto, somarDias } from "@/lib/calendario";
import {
  horarioDosMinutos,
  minutosDoHorario,
  type ReuniaoParaConflito,
} from "@/lib/agendaConflitos";
import { AgendarReuniaoModal } from "@/components/AgendarReuniaoModal";
import { ReuniaoSemHorarioModal } from "@/components/ReuniaoSemHorarioModal";
import { MiniCalendario } from "@/components/MiniCalendario";
import { AgendaResumo, type ProximaReuniao } from "@/components/AgendaResumo";
import type { GrupoParaAgendar } from "@/lib/agendaStatus";

export type ReuniaoDoDia = {
  id: string;
  grupoId: string;
  hora: string | null;
  duracaoMin: number;
  grupoNome: string;
  responsavelId: string | null;
  responsavelNome: string | null;
  linkReuniao: string | null;
  resumo: string;
};

const HORA_INICIO_GRADE = 8;
const HORA_FIM_GRADE = 21;
const MIN_INICIO = HORA_INICIO_GRADE * 60;
const MIN_FIM = HORA_FIM_GRADE * 60;
const LINHAS_TOTAIS = (HORA_FIM_GRADE - HORA_INICIO_GRADE) * 2;
const ALTURA_LINHA = 28; // px por slot de 30 min
const PX_POR_MIN = ALTURA_LINHA / 30;

const HORAS_LABEL = Array.from(
  { length: HORA_FIM_GRADE - HORA_INICIO_GRADE },
  (_, i) => `${String(HORA_INICIO_GRADE + i).padStart(2, "0")}:00`
);

function horaDoSlot(indice: number): string {
  return horarioDosMinutos(MIN_INICIO + indice * 30);
}

type Evento =
  | {
      tipo: "compromisso";
      key: string;
      inicio: number;
      fim: number;
      label: string;
    }
  | {
      tipo: "reuniao";
      key: string;
      inicio: number;
      fim: number;
      reuniao: ReuniaoDoDia;
    };

type EventoPosicionado = Evento & { coluna: number; colunas: number; span: number };

function sobrepoe(a: { inicio: number; fim: number }, b: { inicio: number; fim: number }) {
  return a.inicio < b.fim && b.inicio < a.fim;
}

// Layout "lado a lado" (estilo Google Agenda): eventos que se cruzam formam
// um grupo que divide a largura do dia; cada evento vai pra primeira coluna
// livre e depois se estica pras colunas vizinhas que estiverem vagas no
// intervalo dele.
function posicionarLadoALado(eventos: Evento[]): EventoPosicionado[] {
  const ordenados = [...eventos].sort(
    (a, b) => a.inicio - b.inicio || b.fim - a.fim
  );
  const resultado: EventoPosicionado[] = [];

  let grupo: Evento[][] = [];
  let fimDoGrupo = -1;

  function fecharGrupo() {
    const colunas = grupo.length;
    grupo.forEach((coluna, idx) => {
      for (const ev of coluna) {
        let span = 1;
        while (
          idx + span < colunas &&
          !grupo[idx + span].some((outro) => sobrepoe(outro, ev))
        ) {
          span++;
        }
        resultado.push({ ...ev, coluna: idx, colunas, span });
      }
    });
    grupo = [];
    fimDoGrupo = -1;
  }

  for (const ev of ordenados) {
    if (grupo.length > 0 && ev.inicio >= fimDoGrupo) fecharGrupo();
    const livre = grupo.find((coluna) => coluna[coluna.length - 1].fim <= ev.inicio);
    if (livre) livre.push(ev);
    else grupo.push([ev]);
    fimDoGrupo = Math.max(fimDoGrupo, ev.fim);
  }
  if (grupo.length > 0) fecharGrupo();

  return resultado;
}

type Tooltip = { x: number; y: number; titulo: string; linhas: string[] };

export function CalendarioAgenda({
  dias,
  reunioesPorDia,
  pabloId,
  responsaveis,
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
  responsaveis: { id: string; nome: string }[];
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
  const [slotHover, setSlotHover] = useState<{ data: string; indice: number } | null>(
    null
  );
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [semHorarioAberta, setSemHorarioAberta] = useState<{
    reuniao: ReuniaoDoDia;
    data: string;
  } | null>(null);
  // "todos" ou o id do responsável
  const [filtro, setFiltro] = useState("todos");

  const dataSelecionadaMini = dias[0] === hoje ? hoje : dias[0];
  const podeAgendar = responsaveis.length > 0;

  const nomeResponsavel = useCallback(
    (id: string | null, nome: string | null) =>
      id && id === pabloId ? "Dr. Pablo" : (nome ?? "Sem responsável"),
    [pabloId]
  );

  const reunioesPorData = useMemo(() => {
    const mapa: Record<string, ReuniaoParaConflito[]> = {};
    for (const d of dias) {
      mapa[d] = (reunioesPorDia[d] ?? [])
        .filter((r) => r.hora)
        .map((r) => ({
          id: r.id,
          hora: r.hora!.slice(0, 5),
          duracaoMin: r.duracaoMin,
          responsavelId: r.responsavelId,
          grupoNome: r.grupoNome,
        }));
    }
    return mapa;
  }, [dias, reunioesPorDia]);

  const mostrarCompromissos = filtro === "todos" || filtro === pabloId;

  const eventosPorDia = useMemo(() => {
    const mapa: Record<string, EventoPosicionado[]> = {};
    for (const d of dias) {
      const eventos: Evento[] = [];
      if (mostrarCompromissos) {
        blocosClinicaPablo(d).forEach((b, i) => {
          eventos.push({
            tipo: "compromisso",
            key: `c-${i}`,
            inicio: minutosDoHorario(b.inicio),
            fim: minutosDoHorario(b.fim),
            label: b.label,
          });
        });
      }
      for (const r of reunioesPorDia[d] ?? []) {
        if (!r.hora) continue;
        if (filtro !== "todos" && r.responsavelId !== filtro) continue;
        const inicio = minutosDoHorario(r.hora.slice(0, 5));
        eventos.push({
          tipo: "reuniao",
          key: r.id,
          inicio,
          fim: inicio + r.duracaoMin,
          reuniao: r,
        });
      }
      mapa[d] = posicionarLadoALado(
        eventos
          .map((e) => ({
            ...e,
            inicio: Math.max(e.inicio, MIN_INICIO),
            fim: Math.min(e.fim, MIN_FIM),
          }))
          .filter((e) => e.fim > e.inicio)
      );
    }
    return mapa;
  }, [dias, reunioesPorDia, filtro, mostrarCompromissos]);

  // Reuniões sem `hora` não têm lugar na grade: vão pra faixa "Sem horário"
  // logo abaixo do cabeçalho do dia (mesmo filtro por responsável).
  const semHorarioPorDia = useMemo(() => {
    const mapa: Record<string, ReuniaoDoDia[]> = {};
    for (const d of dias) {
      mapa[d] = (reunioesPorDia[d] ?? []).filter(
        (r) => !r.hora && (filtro === "todos" || r.responsavelId === filtro)
      );
    }
    return mapa;
  }, [dias, reunioesPorDia, filtro]);
  const temSemHorario = dias.some((d) => semHorarioPorDia[d].length > 0);

  function mostrarTooltip(e: React.MouseEvent | React.FocusEvent, t: Omit<Tooltip, "x" | "y">) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const LARGURA_TOOLTIP = 256;
    const x =
      rect.right + 6 + LARGURA_TOOLTIP > window.innerWidth
        ? rect.left - 6 - LARGURA_TOOLTIP
        : rect.right + 6;
    setTooltip({ ...t, x, y: rect.top });
  }

  function corDaReuniao(r: ReuniaoDoDia): string {
    if (r.responsavelId && r.responsavelId === pabloId) {
      return "border-accent bg-accent/25 text-text-primary";
    }
    if (r.responsavelId) {
      return "border-status-ok-text bg-status-ok-text/20 text-text-primary";
    }
    return "border-text-tertiary bg-status-neutral-bg text-text-primary";
  }

  // O corpo do evento não captura o mouse (o clique cai no slot de baixo);
  // só o ícone de detalhes captura.
  function renderEvento(ev: EventoPosicionado) {
    const estilo = {
      top: (ev.inicio - MIN_INICIO) * PX_POR_MIN + 1,
      height: (ev.fim - ev.inicio) * PX_POR_MIN - 2,
      left: `calc(${(ev.coluna / ev.colunas) * 100}% + 2px)`,
      width: `calc(${(ev.span / ev.colunas) * 100}% - 4px)`,
    };
    const horario = `${horarioDosMinutos(ev.inicio)}–${horarioDosMinutos(ev.fim)}`;

    if (ev.tipo === "compromisso") {
      const detalhes = {
        titulo: ev.label,
        linhas: [
          horario,
          "Compromisso da clínica do Dr. Pablo",
          "Grade fixa (PDF de horários) · só leitura",
        ],
      };
      return (
        <div
          key={ev.key}
          className="agenda-compromisso pointer-events-none absolute overflow-hidden rounded border-l-2 border-text-tertiary/60 py-0.5 pl-1.5 pr-5 text-[10px] leading-tight text-text-secondary"
          style={estilo}
        >
          <p className="truncate font-medium">{ev.label}</p>
          <p className="truncate tabular-nums text-text-tertiary">{horario}</p>
          <button
            type="button"
            aria-label={`Detalhes: ${ev.label}`}
            className="pointer-events-auto absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-text-tertiary hover:bg-bg-surface-hover hover:text-text-primary"
            onMouseEnter={(e) => mostrarTooltip(e, detalhes)}
            onFocus={(e) => mostrarTooltip(e, detalhes)}
            onMouseLeave={() => setTooltip(null)}
            onBlur={() => setTooltip(null)}
          >
            ⓘ
          </button>
        </div>
      );
    }

    const r = ev.reuniao;
    const responsavel = nomeResponsavel(r.responsavelId, r.responsavelNome);
    const detalhes = {
      titulo: r.grupoNome,
      linhas: [
        horario,
        `Responsável: ${responsavel}`,
        ...(r.linkReuniao ? [r.linkReuniao] : []),
        "Clique pra abrir as reuniões do grupo",
      ],
    };
    return (
      <div
        key={ev.key}
        className={`pointer-events-none absolute overflow-hidden rounded border-l-2 py-0.5 pl-1.5 pr-5 text-[10px] leading-tight shadow-sm ${corDaReuniao(r)}`}
        style={estilo}
      >
        <p className="truncate font-semibold">{r.grupoNome}</p>
        <p className="truncate tabular-nums text-text-secondary">
          {horario} · {responsavel}
        </p>
        <Link
          href={`/grupos/${r.grupoId}/reunioes`}
          prefetch={false}
          aria-label={`Abrir reuniões de ${r.grupoNome}`}
          className="pointer-events-auto absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-text-secondary hover:bg-bg-surface hover:text-text-primary"
          onMouseEnter={(e) => mostrarTooltip(e, detalhes)}
          onFocus={(e) => mostrarTooltip(e, detalhes)}
          onMouseLeave={() => setTooltip(null)}
          onBlur={() => setTooltip(null)}
        >
          ↗
        </Link>
      </div>
    );
  }

  const opcoesFiltro = [
    { valor: "todos", label: "Todos" },
    ...responsaveis
      .filter((r) => r.id !== pabloId)
      .map((r) => ({ valor: r.id, label: r.nome })),
    ...(pabloId ? [{ valor: pabloId, label: "Dr. Pablo" }] : []),
  ];

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

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
            <span className="ml-1 text-sm text-text-secondary">
              {formatDiaMesCurto(dias[0])} — {formatDiaMesCurto(dias[6])}
            </span>
          </div>

          <div
            role="radiogroup"
            aria-label="Filtrar por responsável"
            className="flex rounded-lg border border-border bg-bg-surface p-0.5"
          >
            {opcoesFiltro.map((o) => (
              <button
                key={o.valor}
                type="button"
                role="radio"
                aria-checked={filtro === o.valor}
                onClick={() => setFiltro(o.valor)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  filtro === o.valor
                    ? "bg-accent text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border-l-2 border-accent bg-accent/25" />
            Reunião Dr. Pablo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border-l-2 border-status-ok-text bg-status-ok-text/20" />
            Reunião Rafael
          </span>
          <span className="flex items-center gap-1.5">
            <span className="agenda-compromisso h-3 w-3 rounded-sm border-l-2 border-text-tertiary/60" />
            Compromisso da clínica
          </span>
          <span className="text-text-tertiary">
            · Clique em qualquer horário pra agendar
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-bg-surface">
          <div
            className="grid min-w-[880px]"
            style={{ gridTemplateColumns: "56px repeat(7, minmax(0, 1fr))" }}
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

            {temSemHorario && (
              <>
                <div className="flex items-start justify-end border-b border-r border-border px-1 pb-3.5 pt-1.5 text-right text-[10px] leading-tight text-text-tertiary">
                  Sem horário
                </div>
                {dias.map((d) => (
                  <div
                    key={d}
                    className="flex min-w-0 flex-col gap-1 border-b border-r border-border p-1 last:border-r-0"
                  >
                    {semHorarioPorDia[d].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSemHorarioAberta({ reuniao: r, data: d })}
                        title={`${r.grupoNome} · ${nomeResponsavel(r.responsavelId, r.responsavelNome)} · sem horário`}
                        className={`block w-full truncate rounded border-l-2 px-1.5 py-1 text-left text-[10px] font-semibold leading-tight hover:brightness-125 ${corDaReuniao(r)}`}
                      >
                        {r.grupoNome}
                      </button>
                    ))}
                  </div>
                ))}
              </>
            )}

            <div
              className="relative border-r border-border"
              style={{ height: LINHAS_TOTAIS * ALTURA_LINHA }}
            >
              {HORAS_LABEL.map((h, i) => (
                <span
                  key={h}
                  className="absolute right-1 -translate-y-1/2 text-[10px] tabular-nums text-text-secondary"
                  style={{ top: i * 2 * ALTURA_LINHA }}
                >
                  {h}
                </span>
              ))}
            </div>

            {dias.map((diaISO) => {
              const passou = diaISO < hoje;
              const clicavel = podeAgendar && !passou;
              const hoverAqui = slotHover?.data === diaISO ? slotHover.indice : null;

              return (
                <div
                  key={diaISO}
                  className={`relative border-r border-border last:border-r-0 ${
                    passou ? "bg-bg-base/40" : ""
                  }`}
                  style={{ height: LINHAS_TOTAIS * ALTURA_LINHA }}
                  onMouseLeave={() => setSlotHover(null)}
                >
                  {/* Camada 1: slots de 30 min, largura total. São eles que
                      recebem o clique, inclusive embaixo de compromissos e
                      reuniões (que deixam o clique passar). */}
                  {Array.from({ length: LINHAS_TOTAIS }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      tabIndex={clicavel ? 0 : -1}
                      disabled={!clicavel}
                      aria-label={`Agendar ${formatDiaMesCurto(diaISO)} às ${horaDoSlot(i)}`}
                      onMouseEnter={() => clicavel && setSlotHover({ data: diaISO, indice: i })}
                      onFocus={() => clicavel && setSlotHover({ data: diaISO, indice: i })}
                      onClick={() => setSlotAberto({ data: diaISO, hora: horaDoSlot(i) })}
                      className={`absolute inset-x-0 block outline-none ${
                        clicavel ? "cursor-pointer" : "cursor-default"
                      }`}
                      style={{ top: i * ALTURA_LINHA, height: ALTURA_LINHA }}
                    />
                  ))}

                  {/* Camada 2: compromissos, depois as linhas da grade por
                      cima deles (pra continuarem visíveis), depois reuniões. */}
                  {eventosPorDia[diaISO]
                    .filter((ev) => ev.tipo === "compromisso")
                    .map(renderEvento)}
                  <div aria-hidden className="agenda-linhas pointer-events-none absolute inset-0" />
                  {eventosPorDia[diaISO]
                    .filter((ev) => ev.tipo === "reuniao")
                    .map(renderEvento)}

                  {/* Camada 3: destaque do slot sob o mouse, por cima de tudo,
                      com o horário que vai abrir no modal. */}
                  {hoverAqui != null && (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-10 rounded-sm bg-accent/10 ring-1 ring-inset ring-accent/70"
                      style={{ top: hoverAqui * ALTURA_LINHA, height: ALTURA_LINHA }}
                    >
                      <span className="absolute left-1 top-1/2 -translate-y-1/2 rounded bg-accent px-1 text-[10px] font-semibold tabular-nums text-white">
                        {horaDoSlot(hoverAqui)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {tooltip && (
          <div
            role="tooltip"
            className="pointer-events-none fixed z-40 max-w-64 rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-xs shadow-xl"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <p className="font-medium text-text-primary">{tooltip.titulo}</p>
            {tooltip.linhas.map((l) => (
              <p key={l} className="break-words text-text-secondary">
                {l}
              </p>
            ))}
          </div>
        )}

        {semHorarioAberta && (
          <ReuniaoSemHorarioModal
            key={semHorarioAberta.reuniao.id}
            reuniao={semHorarioAberta.reuniao}
            data={semHorarioAberta.data}
            responsavelNome={nomeResponsavel(
              semHorarioAberta.reuniao.responsavelId,
              semHorarioAberta.reuniao.responsavelNome
            )}
            pabloId={pabloId}
            reunioesPorData={reunioesPorData}
            onClose={() => setSemHorarioAberta(null)}
          />
        )}

        {slotAberto && (
          <AgendarReuniaoModal
            dataInicial={slotAberto.data}
            horaInicial={slotAberto.hora}
            responsavelInicial={filtro === "todos" ? "" : filtro}
            hoje={hoje}
            grupos={grupos}
            responsaveis={responsaveis}
            pabloId={pabloId}
            reunioesPorData={reunioesPorData}
            onClose={() => setSlotAberto(null)}
          />
        )}
      </div>
    </div>
  );
}
