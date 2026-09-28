"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { definirHorarioReuniao } from "@/app/actions/reunioes";
import {
  calcularConflitos,
  horarioDosMinutos,
  minutosDoHorario,
  type Conflito,
  type ReuniaoParaConflito,
} from "@/lib/agendaConflitos";
import { formatDiaSemanaCurto, formatDiaMesCurto } from "@/lib/calendario";
import { OPCOES_DURACAO } from "@/components/AgendarReuniaoModal";
import type { ReuniaoDoDia } from "@/components/CalendarioAgenda";

const CAMPO =
  "w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent";

// Reunião da faixa "Sem horário": mostra os dados e, no modo Editar,
// deixa definir início e duração (Editar → Salvar / Cancelar).
export function ReuniaoSemHorarioModal({
  reuniao,
  data,
  responsavelNome,
  pabloId,
  reunioesPorData,
  onClose,
}: {
  reuniao: ReuniaoDoDia;
  data: string;
  responsavelNome: string;
  pabloId: string | null;
  reunioesPorData: Record<string, ReuniaoParaConflito[]>;
  onClose: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [hora, setHora] = useState("");
  const [duracaoMin, setDuracaoMin] = useState(reuniao.duracaoMin || 60);
  const [forcarEncaixe, setForcarEncaixe] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [conflitosServidor, setConflitosServidor] = useState<Conflito[] | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const horaValida = /^\d{2}:\d{2}$/.test(hora);
  const fimMin = horaValida ? minutosDoHorario(hora) + duracaoMin : null;
  const fim = fimMin != null && fimMin <= 24 * 60 ? horarioDosMinutos(fimMin) : null;

  const conflitosPrevios = useMemo(() => {
    if (!reuniao.responsavelId || !horaValida) return [];
    return calcularConflitos({
      data,
      hora,
      duracaoMin,
      responsavelId: reuniao.responsavelId,
      pabloId,
      ignorarReuniaoId: reuniao.id,
      reunioesDoDia: reunioesPorData[data] ?? [],
    });
  }, [data, hora, duracaoMin, horaValida, pabloId, reuniao, reunioesPorData]);

  const conflitos = conflitosServidor ?? conflitosPrevios;

  function salvar() {
    setErro(null);
    if (!horaValida) return setErro("Informe o horário de início.");
    if (!fim) return setErro("A reunião passaria da meia-noite.");
    if (conflitos.length > 0 && !forcarEncaixe) {
      return setErro('Esse horário tem conflito. Marque "Forçar encaixe" pra salvar mesmo assim.');
    }
    startTransition(async () => {
      const res = await definirHorarioReuniao({
        reuniaoId: reuniao.id,
        hora,
        duracaoMin,
        forcarEncaixe,
      });
      if (res.ok) {
        onClose();
        return;
      }
      setErro(res.error);
      if (res.conflitos) setConflitosServidor(res.conflitos);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={`Reunião ${reuniao.grupoNome}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md space-y-4 overflow-y-auto rounded-xl border border-border bg-bg-surface-hover p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-text-primary">
              {reuniao.grupoNome}
            </h2>
            <p className="text-xs text-text-secondary">
              {formatDiaSemanaCurto(data)}, {formatDiaMesCurto(data)} · sem horário definido
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded p-1 text-text-secondary hover:bg-bg-surface hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-text-secondary">Responsável</dt>
            <dd className="text-text-primary">{responsavelNome}</dd>
          </div>
          {reuniao.resumo && (
            <div>
              <dt className="text-text-secondary">Pauta</dt>
              <dd className="mt-0.5 whitespace-pre-line text-text-primary">{reuniao.resumo}</dd>
            </div>
          )}
          {reuniao.linkReuniao && (
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">Link</dt>
              <dd className="truncate">
                <a
                  href={reuniao.linkReuniao}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:text-accent-hover"
                >
                  {reuniao.linkReuniao}
                </a>
              </dd>
            </div>
          )}
        </dl>

        {editando ? (
          <form
            className="space-y-3 border-t border-border pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              salvar();
            }}
          >
            {erro && (
              <p className="rounded-lg bg-status-alert-bg px-3 py-2 text-xs text-status-alert-text">
                {erro}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-text-secondary">Início</label>
                <input
                  type="time"
                  step={300}
                  value={hora}
                  autoFocus
                  onChange={(e) => {
                    setHora(e.target.value);
                    setConflitosServidor(null);
                  }}
                  className={CAMPO}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-secondary">Duração</label>
                <select
                  value={duracaoMin}
                  onChange={(e) => {
                    setDuracaoMin(Number(e.target.value));
                    setConflitosServidor(null);
                  }}
                  className={CAMPO}
                >
                  {OPCOES_DURACAO.map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-text-secondary">
              Termina às{" "}
              <span className="font-medium tabular-nums text-text-primary">{fim ?? "—"}</span>
            </p>

            {horaValida && conflitos.length > 0 && (
              <div className="rounded-lg border border-status-warn-text/30 bg-status-warn-bg px-3 py-2 text-xs text-status-warn-text">
                <p className="font-medium">Conflita com:</p>
                <ul className="mt-1 space-y-0.5">
                  {conflitos.map((c, i) => (
                    <li key={i} className="tabular-nums">
                      {c.inicio}–{c.fim} · {c.descricao}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <label className="flex items-center gap-2 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={forcarEncaixe}
                onChange={(e) => setForcarEncaixe(e.target.checked)}
                className="accent-accent"
              />
              Forçar encaixe (salvar mesmo com conflito)
            </label>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
              >
                {isPending ? "Salvando…" : "Salvar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditando(false);
                  setErro(null);
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-bg-surface"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <Link
              href={`/grupos/${reuniao.grupoId}/reunioes`}
              prefetch={false}
              className="text-sm text-accent hover:text-accent-hover"
            >
              Abrir no grupo
            </Link>
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-primary hover:bg-bg-surface"
            >
              Editar horário
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
