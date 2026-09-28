"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { agendarReuniao } from "@/app/actions/reunioes";
import {
  calcularConflitos,
  horarioDosMinutos,
  minutosDoHorario,
  type Conflito,
  type ReuniaoParaConflito,
} from "@/lib/agendaConflitos";
import { formatDiaSemanaCurto, formatDiaMesCurto } from "@/lib/calendario";

const OPCOES_DURACAO = [
  { valor: 15, label: "15 min" },
  { valor: 30, label: "30 min" },
  { valor: 45, label: "45 min" },
  { valor: 60, label: "1h" },
  { valor: 90, label: "1h30" },
  { valor: 120, label: "2h" },
  { valor: 150, label: "2h30" },
  { valor: 180, label: "3h" },
];

const CAMPO =
  "w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent";

export function AgendarReuniaoModal({
  dataInicial,
  horaInicial,
  responsavelInicial,
  hoje,
  grupos,
  responsaveis,
  pabloId,
  reunioesPorData,
  onClose,
}: {
  dataInicial: string;
  horaInicial: string;
  responsavelInicial: string;
  hoje: string;
  grupos: { id: string; nome: string }[];
  responsaveis: { id: string; nome: string }[];
  pabloId: string | null;
  // Reuniões que a tela já tem carregadas (semana visível). Fora dela o
  // aviso prévio não aparece, mas o servidor confere do mesmo jeito.
  reunioesPorData: Record<string, ReuniaoParaConflito[]>;
  onClose: () => void;
}) {
  const [data, setData] = useState(dataInicial);
  const [hora, setHora] = useState(horaInicial);
  const [duracaoMin, setDuracaoMin] = useState(60);
  const [grupoId, setGrupoId] = useState("");
  const [responsavelId, setResponsavelId] = useState(responsavelInicial);
  const [linkReuniao, setLinkReuniao] = useState("");
  const [resumo, setResumo] = useState("");
  const [forcarEncaixe, setForcarEncaixe] = useState(false);
  const [erros, setErros] = useState<string[]>([]);
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
  const semanaCarregada = data in reunioesPorData;

  const conflitosPrevios = useMemo(() => {
    if (!responsavelId || !horaValida || !data) return [];
    return calcularConflitos({
      data,
      hora,
      duracaoMin,
      responsavelId,
      pabloId,
      reunioesDoDia: reunioesPorData[data] ?? [],
    });
  }, [data, hora, duracaoMin, responsavelId, pabloId, horaValida, reunioesPorData]);

  // Depois que o servidor respondeu, a lista dele vale até o usuário mexer
  // em algo que muda o resultado.
  const conflitos = conflitosServidor ?? conflitosPrevios;
  const temConflito = conflitos.length > 0;

  function limparRespostaServidor() {
    setConflitosServidor(null);
  }

  function confirmar() {
    const faltando: string[] = [];
    if (!grupoId) faltando.push("Escolha o grupo.");
    if (!responsavelId) faltando.push("Escolha o responsável.");
    if (!data) faltando.push("Informe a data.");
    else if (data < hoje) faltando.push("Essa data já passou.");
    if (!horaValida) faltando.push("Informe o horário de início.");
    else if (!fim) faltando.push("A reunião passaria da meia-noite.");
    setErros(faltando);
    if (faltando.length > 0) return;
    if (temConflito && !forcarEncaixe) {
      setErros(['Esse horário tem conflito. Marque "Forçar encaixe" pra salvar mesmo assim.']);
      return;
    }

    startTransition(async () => {
      const res = await agendarReuniao({
        grupoId,
        responsavelId,
        data,
        hora,
        duracaoMin,
        linkReuniao,
        resumo,
        forcarEncaixe,
      });
      if (res.ok) {
        onClose();
        return;
      }
      setErros([res.error]);
      if (res.conflitos) setConflitosServidor(res.conflitos);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <form
        role="dialog"
        aria-label="Agendar reunião"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          confirmar();
        }}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md space-y-3 overflow-y-auto rounded-xl border border-border bg-bg-surface-hover p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-text-primary">
              Agendar reunião
            </h2>
            {data && horaValida && (
              <p className="text-xs text-text-secondary">
                {formatDiaSemanaCurto(data)}, {formatDiaMesCurto(data)} · {hora}
                {fim ? ` – ${fim}` : ""}
              </p>
            )}
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

        {erros.length > 0 && (
          <div className="space-y-0.5 rounded-lg bg-status-alert-bg px-3 py-2 text-xs text-status-alert-text">
            {erros.map((e) => (
              <p key={e}>{e}</p>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="mb-1 block text-xs text-text-secondary">Data</label>
            <input
              type="date"
              value={data}
              min={hoje}
              onChange={(e) => {
                setData(e.target.value);
                limparRespostaServidor();
              }}
              className={CAMPO}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-secondary">Início</label>
            <input
              type="time"
              step={300}
              value={hora}
              onChange={(e) => {
                setHora(e.target.value);
                limparRespostaServidor();
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
                limparRespostaServidor();
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
          <p className="col-span-2 -mt-1 text-xs text-text-secondary">
            Termina às{" "}
            <span className="font-medium tabular-nums text-text-primary">{fim ?? "—"}</span>
          </p>

          <div>
            <label className="mb-1 block text-xs text-text-secondary">Grupo *</label>
            <select
              value={grupoId}
              onChange={(e) => setGrupoId(e.target.value)}
              className={CAMPO}
            >
              <option value="">Selecione…</option>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-secondary">Responsável *</label>
            <select
              value={responsavelId}
              onChange={(e) => {
                setResponsavelId(e.target.value);
                limparRespostaServidor();
              }}
              className={CAMPO}
            >
              <option value="">Selecione…</option>
              {responsaveis.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id === pabloId ? "Dr. Pablo" : r.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {responsavelId && horaValida && fim && (
          temConflito ? (
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
          ) : semanaCarregada || conflitosServidor ? (
            <p className="rounded-lg bg-status-ok-bg px-3 py-2 text-xs text-status-ok-text">
              Horário livre pra esse responsável.
            </p>
          ) : (
            <p className="text-xs text-text-tertiary">
              Os conflitos dessa data são conferidos ao confirmar.
            </p>
          )
        )}

        <div>
          <label className="mb-1 block text-xs text-text-secondary">
            Link da reunião (opcional)
          </label>
          <input
            type="url"
            value={linkReuniao}
            onChange={(e) => setLinkReuniao(e.target.value)}
            placeholder="https://meet.google.com/..."
            className={CAMPO}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-text-secondary">
            Pauta / observação (opcional)
          </label>
          <textarea
            rows={2}
            value={resumo}
            onChange={(e) => setResumo(e.target.value)}
            className={CAMPO}
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-text-secondary">
          <input
            type="checkbox"
            checked={forcarEncaixe}
            onChange={(e) => setForcarEncaixe(e.target.checked)}
            className="accent-accent"
          />
          Forçar encaixe (salvar mesmo com conflito)
        </label>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {isPending ? "Agendando…" : "Confirmar"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-bg-surface"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
