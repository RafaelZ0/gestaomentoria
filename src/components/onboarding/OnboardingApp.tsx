"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  STEPS,
  funnel,
  isFilled,
  nomeArquivoResumo,
  resumoTexto,
  stepProgress,
  verbaStatus,
  type OnboardingPrecisao,
  type OnboardingValores,
} from "@/lib/onboarding";
import {
  concluirOnboarding,
  salvarOnboarding,
  salvarParticipantesOnboarding,
} from "@/app/actions/onboarding";
import { CampoOnboardingInput } from "@/components/onboarding/CampoOnboardingInput";
import { FunilOnboarding } from "@/components/onboarding/FunilOnboarding";
import { OnboardingXray } from "@/components/onboarding/OnboardingXray";
import type { StatusOnboarding } from "@/lib/database.types";

type EstadoSalvamento = "ocioso" | "pendente" | "salvando" | "salvo" | "erro";

const CHAVE_BACKUP = (id: string) => `onboarding-backup:${id}`;

function Roteiro({ linhas }: { linhas: string[] }) {
  return (
    <div className="mb-6 space-y-2 rounded-r-xl border-l-4 border-status-warn-text bg-status-warn-bg px-5 py-4 text-sm text-text-primary">
      <p className="text-xs font-semibold uppercase tracking-wider text-status-warn-text">
        Roteiro (só pra você)
      </p>
      {linhas.map((linha, i) => (
        <p key={i}>
          {linha.split(/(<em>.*?<\/em>)/).map((parte, j) =>
            parte.startsWith("<em>") ? (
              <em key={j}>{parte.replace(/<\/?em>/g, "")}</em>
            ) : (
              <span key={j}>{parte}</span>
            )
          )}
        </p>
      ))}
    </div>
  );
}

export function OnboardingApp({
  onboardingId,
  grupoId,
  reuniaoId,
  statusInicial,
  respostasIniciais,
  precisaoIniciais,
  modoInicial,
  mentorados,
  participantesIniciais,
}: {
  onboardingId: string;
  grupoId: string;
  reuniaoId: string | null;
  statusInicial: StatusOnboarding;
  respostasIniciais: OnboardingValores;
  precisaoIniciais: OnboardingPrecisao;
  modoInicial: "preencher" | "raio-x";
  mentorados: { id: string; nome: string }[];
  participantesIniciais: string[];
}) {
  const [respostas, setRespostas] = useState<OnboardingValores>(respostasIniciais);
  const [precisao, setPrecisao] = useState<OnboardingPrecisao>(precisaoIniciais);
  const [status, setStatus] = useState<StatusOnboarding>(statusInicial);
  const [modo, setModo] = useState(modoInicial);
  const [etapa, setEtapa] = useState(() => {
    const i = STEPS.findIndex((s) => stepProgress(respostasIniciais, precisaoIniciais, s) < 0.999);
    return i === -1 ? 0 : i;
  });
  const [mostrarRoteiro, setMostrarRoteiro] = useState(false);
  const [salvamento, setSalvamento] = useState<EstadoSalvamento>("ocioso");
  const [aviso, setAviso] = useState<string | null>(null);
  const [participantes, setParticipantes] = useState<string[]>(participantesIniciais);
  const [erroParticipantes, setErroParticipantes] = useState<string | null>(null);
  const [concluindo, startConcluir] = useTransition();

  const dadosRef = useRef({ respostas, precisao });
  const versaoRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emVooRef = useRef(false);
  const salvamentoRef = useRef<EstadoSalvamento>("ocioso");
  const salvarRef = useRef<() => Promise<void>>(async () => {});

  const mudarSalvamento = useCallback((e: EstadoSalvamento) => {
    salvamentoRef.current = e;
    setSalvamento(e);
  }, []);

  // Salvamento serializado: nunca dois ao mesmo tempo, e se algo mudou
  // enquanto salvava, salva de novo com o mais recente. Em erro, os dados
  // continuam na tela (e no backup do navegador) e tenta de novo em 5s.
  useEffect(() => {
    async function salvar(): Promise<void> {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (emVooRef.current) return;
      emVooRef.current = true;
      const versao = versaoRef.current;
      const { respostas: r, precisao: p } = dadosRef.current;
      mudarSalvamento("salvando");

      let ok = false;
      try {
        ok = (await salvarOnboarding(onboardingId, r, p)).ok;
      } catch {
        ok = false;
      }
      emVooRef.current = false;

      if (versao !== versaoRef.current) {
        if (!timerRef.current) void salvar();
        return;
      }
      if (ok) {
        mudarSalvamento("salvo");
        try {
          localStorage.removeItem(CHAVE_BACKUP(onboardingId));
        } catch {}
      } else {
        mudarSalvamento("erro");
        timerRef.current = setTimeout(() => void salvar(), 5000);
      }
    }
    salvarRef.current = salvar;
  }, [onboardingId, mudarSalvamento]);

  const registrarMudanca = useCallback(
    (r: OnboardingValores, p: OnboardingPrecisao) => {
      dadosRef.current = { respostas: r, precisao: p };
      versaoRef.current += 1;
      mudarSalvamento("pendente");
      try {
        localStorage.setItem(CHAVE_BACKUP(onboardingId), JSON.stringify({ respostas: r, precisao: p }));
      } catch {}
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void salvarRef.current(), 900);
    },
    [onboardingId, mudarSalvamento]
  );

  // Recupera o que ficou no navegador sem salvar (ex: caiu a internet e a
  // aba foi fechada) e manda pro banco. Só na primeira montagem: depois
  // disso o backup é só o espelho do que já está na tela.
  const verificouBackupRef = useRef(false);
  useEffect(() => {
    if (verificouBackupRef.current) return;
    const t = setTimeout(() => {
      verificouBackupRef.current = true;
      let backup: { respostas: OnboardingValores; precisao: OnboardingPrecisao } | null = null;
      try {
        const bruto = localStorage.getItem(CHAVE_BACKUP(onboardingId));
        backup = bruto ? JSON.parse(bruto) : null;
      } catch {
        backup = null;
      }
      if (!backup?.respostas) return;
      if (
        JSON.stringify(backup) ===
        JSON.stringify({ respostas: respostasIniciais, precisao: precisaoIniciais })
      ) {
        try {
          localStorage.removeItem(CHAVE_BACKUP(onboardingId));
        } catch {}
        return;
      }
      setRespostas(backup.respostas);
      setPrecisao(backup.precisao ?? {});
      setAviso("Recuperamos respostas que não tinham sido salvas da última vez.");
      registrarMudanca(backup.respostas, backup.precisao ?? {});
    }, 0);
    return () => clearTimeout(t);
  }, [onboardingId, respostasIniciais, precisaoIniciais, registrarMudanca]);

  // Salva o que estiver pendente ao sair da aba (navegação interna) e avisa
  // antes de fechar o navegador com algo sem salvar.
  useEffect(() => {
    const antesDeSair = (e: BeforeUnloadEvent) => {
      if (["pendente", "salvando", "erro"].includes(salvamentoRef.current)) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", antesDeSair);
    return () => {
      window.removeEventListener("beforeunload", antesDeSair);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        const { respostas: r, precisao: p } = dadosRef.current;
        void salvarOnboarding(onboardingId, r, p);
      }
    };
  }, [onboardingId]);

  function alterarValor(k: string, valor: unknown) {
    const novas = { ...respostas, [k]: valor };
    setRespostas(novas);
    registrarMudanca(novas, precisao);
  }

  function alterarPrecisao(k: string, valor: string) {
    const novaPrecisao = { ...precisao, [k]: valor };
    if (!valor) delete novaPrecisao[k];
    const novas = valor === "naosei" ? { ...respostas, [k]: "" } : respostas;
    setPrecisao(novaPrecisao);
    setRespostas(novas);
    registrarMudanca(novas, novaPrecisao);
  }

  function irPara(i: number) {
    setEtapa(i);
    setModo("preencher");
    window.scrollTo({ top: 0 });
  }

  function concluir() {
    startConcluir(async () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const versao = versaoRef.current;
      mudarSalvamento("salvando");
      let ok = false;
      try {
        ok = (await concluirOnboarding(onboardingId, grupoId, reuniaoId, respostas, precisao)).ok;
      } catch {
        ok = false;
      }
      if (ok) {
        setStatus("concluido");
        if (versao === versaoRef.current) {
          mudarSalvamento("salvo");
          try {
            localStorage.removeItem(CHAVE_BACKUP(onboardingId));
          } catch {}
        }
      } else {
        mudarSalvamento("erro");
        timerRef.current = setTimeout(() => void salvarRef.current(), 5000);
      }
      setModo("raio-x");
      window.scrollTo({ top: 0 });
    });
  }

  function baixarResumo() {
    const md = resumoTexto(respostas, precisao);
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivoResumo(respostas);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function alternarParticipante(id: string) {
    if (!reuniaoId) return;
    const anteriores = participantes;
    const novos = participantes.includes(id)
      ? participantes.filter((x) => x !== id)
      : [...participantes, id];
    setParticipantes(novos);
    setErroParticipantes(null);
    void salvarParticipantesOnboarding(grupoId, reuniaoId, novos).then((r) => {
      if (!r.ok) {
        setParticipantes(anteriores);
        setErroParticipantes(r.error);
      }
    });
  }

  const textoSalvamento: Record<EstadoSalvamento, { txt: string; cor: string }> = {
    ocioso: { txt: "", cor: "" },
    pendente: { txt: "Alterações não salvas…", cor: "text-text-tertiary" },
    salvando: { txt: "Salvando…", cor: "text-text-secondary" },
    salvo: { txt: "✓ Salvo", cor: "text-status-ok-text" },
    erro: {
      txt: "Erro ao salvar — suas respostas continuam aqui, tentando de novo…",
      cor: "text-status-alert-text",
    },
  };

  const s = STEPS[etapa];
  const ultima = etapa === STEPS.length - 1;
  const preenchidos = s.fields.filter((f) => isFilled(respostas, precisao, f)).length;
  const verba = s.id === "divulgacao" ? verbaStatus(respostas) : null;

  return (
    <div className="space-y-6">
      {/* Barra de ferramentas */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              status === "concluido"
                ? "bg-status-ok-bg text-status-ok-text"
                : "bg-status-warn-bg text-status-warn-text"
            }`}
          >
            {status === "concluido" ? "Onboarding concluído" : "Diagnóstico em andamento"}
          </span>
          <span className={`text-sm ${textoSalvamento[salvamento].cor}`} aria-live="polite">
            {textoSalvamento[salvamento].txt}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {modo === "preencher" && (
            <button
              type="button"
              aria-pressed={mostrarRoteiro}
              onClick={() => setMostrarRoteiro((m) => !m)}
              className="btn-secondary"
            >
              {mostrarRoteiro ? "Ocultar roteiro" : "Mostrar roteiro"}
            </button>
          )}
          {modo === "preencher" && status === "concluido" && (
            <button type="button" onClick={() => setModo("raio-x")} className="btn-secondary">
              Ver raio-X
            </button>
          )}
        </div>
      </div>

      {aviso && (
        <div className="flex items-start justify-between gap-3 rounded-lg bg-status-accent-bg px-4 py-3 text-sm text-text-primary">
          <span>{aviso}</span>
          <button type="button" onClick={() => setAviso(null)} className="text-text-secondary hover:text-text-primary">
            ✕
          </button>
        </div>
      )}

      {/* Trilha de etapas */}
      <nav aria-label="Etapas" className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {STEPS.map((st, i) => {
          const progresso = stepProgress(respostas, precisao, st);
          const feito = progresso >= 0.999;
          const atual = modo === "preencher" && i === etapa;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => irPara(i)}
              aria-current={atual ? "step" : undefined}
              className="flex flex-col gap-2 text-left"
            >
              <span className="h-2 overflow-hidden rounded-full bg-bg-surface-hover">
                <span
                  className={`block h-full rounded-full transition-[width] duration-500 ${
                    feito ? "bg-status-ok-text" : "bg-accent"
                  }`}
                  style={{ width: `${Math.round(progresso * 100)}%` }}
                />
              </span>
              <span
                className={`text-xs leading-tight ${
                  atual ? "font-semibold text-text-primary" : "text-text-secondary"
                }`}
              >
                <span className={`mr-1 font-bold ${feito ? "text-status-ok-text" : "text-accent"}`}>
                  {feito ? "✓" : i + 1}
                </span>
                {st.nome}
              </span>
            </button>
          );
        })}
      </nav>

      {modo === "raio-x" ? (
        <OnboardingXray
          respostas={respostas}
          precisao={precisao}
          acoes={
            <>
              <button type="button" onClick={() => irPara(etapa)} className="btn-secondary">
                Editar respostas
              </button>
              <button
                type="button"
                onClick={baixarResumo}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
              >
                Baixar resumo
              </button>
            </>
          }
        />
      ) : (
        <section className="rounded-2xl border border-border bg-bg-surface p-6 sm:p-8" aria-labelledby="titulo-etapa">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 id="titulo-etapa" className="font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
              {s.titulo}
            </h1>
            <span className="whitespace-nowrap text-sm text-text-secondary">
              {preenchidos} de {s.fields.length} respondidas
            </span>
          </div>
          <p className="mb-6 mt-2 max-w-2xl text-lg text-text-secondary">{s.lead}</p>

          {mostrarRoteiro && <Roteiro linhas={s.roteiro} />}

          {s.id === "abertura" && reuniaoId && (
            <div className="mb-6 rounded-xl border border-border bg-bg-base p-5">
              <p className="text-base font-medium text-text-primary">Mentorados na reunião</p>
              <p className="mt-0.5 text-sm text-text-secondary">
                Fica registrado na reunião de onboarding, na aba Reuniões.
              </p>
              {mentorados.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {mentorados.map((m) => {
                    const ativo = participantes.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        aria-pressed={ativo}
                        onClick={() => alternarParticipante(m.id)}
                        className={`rounded-full border px-4 py-2 text-base transition-colors ${
                          ativo
                            ? "border-status-ok-text bg-status-ok-bg font-medium text-status-ok-text"
                            : "border-border bg-bg-surface text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        {ativo ? "✓ " : ""}
                        {m.nome}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-sm text-text-tertiary">
                  Nenhum mentorado cadastrado neste grupo ainda (dá pra cadastrar na Visão geral).
                </p>
              )}
              {erroParticipantes && (
                <p className="mt-2 text-sm text-status-alert-text">{erroParticipantes}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
            {s.fields.map((f) => (
              <CampoOnboardingInput
                key={f.k}
                campo={f}
                respostas={respostas}
                precisao={precisao}
                onValor={alterarValor}
                onPrecisao={alterarPrecisao}
              />
            ))}
          </div>

          {s.id === "numeros" && (
            <div className="mt-8 border-t border-border pt-7">
              <FunilOnboarding funil={funnel(respostas, precisao)} />
            </div>
          )}

          {verba && (
            <p
              aria-live="polite"
              className={`mt-6 rounded-lg px-4 py-3 text-base ${
                verba.ok
                  ? "bg-status-ok-bg text-status-ok-text"
                  : "bg-status-warn-bg text-status-warn-text"
              }`}
            >
              {verba.txt}
            </p>
          )}

          <div className="mt-8 flex justify-between gap-3">
            <button
              type="button"
              disabled={etapa === 0}
              onClick={() => irPara(etapa - 1)}
              className="btn-secondary px-5 py-2.5 text-base disabled:cursor-not-allowed"
            >
              Voltar
            </button>
            {ultima ? (
              <button
                type="button"
                disabled={concluindo}
                onClick={concluir}
                className="rounded-lg bg-accent px-6 py-2.5 text-base font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
              >
                {concluindo ? "Montando o raio-X…" : "Ver o raio-X da clínica"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => irPara(etapa + 1)}
                className="rounded-lg bg-accent px-6 py-2.5 text-base font-semibold text-white hover:bg-accent-hover"
              >
                Próxima etapa
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
