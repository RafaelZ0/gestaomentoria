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

export const OPCOES_DURACAO = [
  { valor: 15, label: "15 min" },
  { valor: 30, label: "30 min" },
  { valor: 45, label: "45 min" },
  { valor: 60, label: "1h" },
  { valor: 90, label: "1h30" },
  { valor: 120, label: "2h" },
  { valor: 150, label: "2h30" },
  { valor: 180, label: "3h" },
];

const CAMPO = "campo";

export function AgendarReuniaoModal({
  dataInicial,
  horaInicial,
  responsavelInicial,
  grupoInicial = "",
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
  grupoInicial?: string;
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
  const [grupoId, setGrupoId] = useState(grupoInicial);
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
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md space-y-3 overflow-y-auto rounded-xl border border-line bg-surface p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[17px] font-semibold text-text">
              Agendar reunião
            </h2>
            {data && horaValida && (
              <p className="text-xs text-text-2">
                {formatDiaSemanaCurto(data)}, {formatDiaMesCurto(data)} · {hora}
                {fim ? ` – ${fim}` : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-text"
          >
            ✕
          </button>
        </div>

        {erros.length > 0 && (
          <div className="space-y-0.5 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
            {erros.map((e) => (
              <p key={e}>{e}</p>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="rotulo mb-1.5">Data</label>
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
            <label className="rotulo mb-1.5">Início</label>
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
            <label className="rotulo mb-1.5">Duração</label>
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
          <p className="col-span-2 -mt-1 text-xs text-text-2">
            Termina às{" "}
            <span className="font-medium tabular-nums text-text">{fim ?? "—"}</span>
          </p>

          <div>
            <label className="rotulo mb-1.5">Grupo *</label>
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
            <label className="rotulo mb-1.5">Responsável *</label>
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
            <div className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-warn">
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
            <p className="rounded-lg bg-ok/10 px-3 py-2 text-xs text-ok">
              Horário livre pra esse responsável.
            </p>
          ) : (
            <p className="text-xs text-muted">
              Os conflitos dessa data são conferidos ao confirmar.
            </p>
          )
        )}

        <div>
          <label className="rotulo mb-1.5">
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
          <label className="rotulo mb-1.5">
            Pauta / observação (opcional)
          </label>
          <textarea
            rows={2}
            value={resumo}
            onChange={(e) => setResumo(e.target.value)}
            className={CAMPO}
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-text-2">
          <input
            type="checkbox"
            checked={forcarEncaixe}
            onChange={(e) => setForcarEncaixe(e.target.checked)}
            className="h-4 w-4"
          />
          Forçar encaixe (salvar mesmo com conflito)
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={isPending} className="btn-primary">
            {isPending ? "Agendando…" : "Confirmar"}
          </button>
        </div>
      </form>
    </div>
  );
}
