"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { updateReuniao, removeReuniao } from "@/app/actions/reunioes";
import { ResponsavelField } from "@/components/ResponsavelField";
import { ParticipantesFields } from "@/components/ParticipantesFields";
import {
  linkWhatsapp,
  mensagemConfirmacaoReuniao,
  mensagemLinkReuniao,
} from "@/lib/whatsapp";
import type { Responsavel } from "@/lib/database.types";

type Participante = {
  id: string;
  nome: string;
  grupoNome: string;
  deOutroGrupo: boolean;
};

export function ReuniaoItem({
  reuniao,
  grupoNome,
  grupoOrigemNome,
  participantes,
  responsavelNome,
  mentoradosDoGrupo,
  grupoStatus,
  grupoDataTermino,
  mentoradosOutrosGrupos,
  responsaveis,
  onboardingHref,
}: {
  reuniao: {
    id: string;
    data: string;
    resumo: string;
    responsavel_id: string | null;
    compareceu: boolean;
    link_reuniao: string | null;
    hora: string | null;
  };
  grupoNome: string;
  grupoOrigemNome?: string;
  participantes: Participante[];
  responsavelNome: string | undefined;
  mentoradosDoGrupo: { id: string; nome: string }[];
  grupoStatus: string;
  grupoDataTermino: string | null;
  mentoradosOutrosGrupos: {
    id: string;
    nome: string;
    grupoNome: string;
    grupoStatus: string;
    grupoDataTermino: string | null;
  }[];
  responsaveis: Responsavel[];
  onboardingHref?: string;
}) {
  const [editando, setEditando] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState(reuniao.data);
  const [naoCompareceu, setNaoCompareceu] = useState(!reuniao.compareceu);
  const hoje = new Date().toISOString().slice(0, 10);
  const agendadaEdicao = data > hoje;
  const agendada = reuniao.data > hoje && reuniao.compareceu;

  if (editando) {
    const participantesIds = new Set(participantes.map((p) => p.id));

    return (
      <li className="rounded-xl border border-line bg-surface p-5">
        <form
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              try {
                await updateReuniao(reuniao.id, formData);
                setEditando(false);
              } catch (e) {
                if (e instanceof Error) setError(e.message);
              }
            });
          }}
          className="space-y-4"
        >
          {error && (
            <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-text-2">Data</label>
              <input
                type="date"
                name="data"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full rounded-lg border border-line bg-hover px-3 py-2 text-text outline-none focus:border-gold"
              />
            </div>
            <ResponsavelField
              responsaveis={responsaveis}
              defaultResponsavelId={reuniao.responsavel_id ?? ""}
            />
          </div>

          {agendadaEdicao && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-text-2">
                  Horário (opcional)
                </label>
                <input
                  type="time"
                  name="hora"
                  defaultValue={reuniao.hora ? reuniao.hora.slice(0, 5) : ""}
                  className="w-full rounded-lg border border-line bg-hover px-3 py-2 text-text outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-text-2">
                  Link da reunião (opcional)
                </label>
                <input
                  type="url"
                  name="link_reuniao"
                  defaultValue={reuniao.link_reuniao ?? ""}
                  placeholder="https://meet.google.com/..."
                  className="w-full rounded-lg border border-line bg-hover px-3 py-2 text-text outline-none focus:border-gold"
                />
              </div>
            </div>
          )}

          {!agendadaEdicao && (
            <label className="flex items-center gap-3 rounded-lg border border-line bg-hover px-3 py-2 text-sm text-text">
              <input
                type="checkbox"
                name="nao_compareceu"
                checked={naoCompareceu}
                onChange={(e) => setNaoCompareceu(e.target.checked)}
                className="h-4 w-4"
              />
              Grupo não compareceu à reunião agendada
            </label>
          )}

          <div>
            <label className="mb-1 block text-sm text-text-2">
              {agendadaEdicao
                ? "Pauta / observação (opcional)"
                : naoCompareceu
                  ? "Observação (opcional)"
                  : "O que foi conversado e definido"}
            </label>
            <textarea
              name="resumo"
              required={!agendadaEdicao && !naoCompareceu}
              rows={agendadaEdicao || naoCompareceu ? 2 : 4}
              defaultValue={reuniao.resumo}
              className="w-full rounded-lg border border-line bg-hover px-3 py-2 text-text outline-none focus:border-gold"
            />
          </div>

          {!agendadaEdicao && !naoCompareceu && (
            <ParticipantesFields
              mentoradosDoGrupo={mentoradosDoGrupo}
              grupoStatus={grupoStatus}
              grupoDataTermino={grupoDataTermino}
              mentoradosOutrosGrupos={mentoradosOutrosGrupos}
              dataReuniao={data}
              participantesSelecionados={participantesIds}
            />
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-on-gold hover:bg-gold-hover disabled:opacity-60"
            >
              {isPending ? "Salvando…" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li
      onClick={() => setEditando(true)}
      className="cursor-pointer rounded-xl border border-line bg-surface p-5 hover:bg-hover"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-text">
            {formatDate(reuniao.data)}
            {reuniao.hora && ` às ${reuniao.hora.slice(0, 5)}`}
          </p>
          {onboardingHref && (
            <span className="rounded-full bg-warn/10 px-2 py-0.5 text-xs font-semibold text-warn">
              Onboarding
            </span>
          )}
          {!reuniao.compareceu && (
            <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
              Não compareceu
            </span>
          )}
          {agendada && (
            <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs font-medium text-gold">
              Agendada
            </span>
          )}
          {grupoOrigemNome && (
            <span
              title="Essa reunião foi agendada por outro grupo; alguém deste grupo participou como convidado."
              className="rounded-full bg-hover px-2 py-0.5 text-xs text-text-2"
            >
              Reunião de {grupoOrigemNome}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {responsavelNome && (
            <span className="rounded-full bg-hover px-2 py-0.5 text-xs text-text-2">
              Conduzida por {responsavelNome}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditando(true);
            }}
            className="text-xs text-text-2 hover:text-text"
          >
            Editar
          </button>
          <button
            disabled={isPending}
            onClick={(e) => {
              e.stopPropagation();
              if (!confirm("Excluir esta reunião? Essa ação não pode ser desfeita.")) {
                return;
              }
              startTransition(async () => {
                try {
                  await removeReuniao(reuniao.id);
                } catch (err) {
                  if (err instanceof Error) setError(err.message);
                }
              });
            }}
            className="text-xs text-text-2 hover:text-danger disabled:opacity-60"
          >
            Excluir
          </button>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-xs text-danger">{error}</p>
      )}
      {reuniao.resumo && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-text-2">{reuniao.resumo}</p>
      )}
      {onboardingHref && (
        <Link
          href={onboardingHref}
          prefetch={false}
          onClick={(e) => e.stopPropagation()}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-warn/40 bg-warn/10 px-3 py-1.5 text-sm font-medium text-warn hover:border-warn"
        >
          Ver raio-X da clínica →
        </Link>
      )}
      {reuniao.link_reuniao && (
        <a
          href={reuniao.link_reuniao}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-2 inline-block text-sm text-gold hover:text-gold-hover"
        >
          {reuniao.link_reuniao}
        </a>
      )}
      {agendada && (
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={linkWhatsapp(
              mensagemConfirmacaoReuniao(grupoNome, reuniao.data, reuniao.hora)
            )}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg border border-line px-2.5 py-1 text-xs text-text-2 hover:bg-hover hover:text-text"
          >
            Lembrete de confirmação
          </a>
          <a
            href={linkWhatsapp(
              mensagemLinkReuniao(grupoNome, reuniao.hora, reuniao.link_reuniao)
            )}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg border border-line px-2.5 py-1 text-xs text-text-2 hover:bg-hover hover:text-text"
          >
            Lembrete com link (10 min antes)
          </a>
        </div>
      )}
      {participantes.length > 0 && (
        <p className="mt-3 text-xs text-text-2">
          Participantes:{" "}
          {participantes
            .map((p) => p.nome + (p.deOutroGrupo && p.grupoNome ? ` (${p.grupoNome})` : ""))
            .join(", ")}
        </p>
      )}
    </li>
  );
}
