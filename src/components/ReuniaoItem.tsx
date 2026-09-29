"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { displayGroupName, formatDate } from "@/lib/format";
import { RowMenu } from "@/components/ui/RowMenu";
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
      <li className="border-b border-line-soft py-5 last:border-b-0">
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
          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="rotulo mb-1.5">Data</label>
              <input
                type="date"
                name="data"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="campo w-full"
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
                <label className="rotulo mb-1.5">
                  Horário (opcional)
                </label>
                <input
                  type="time"
                  name="hora"
                  defaultValue={reuniao.hora ? reuniao.hora.slice(0, 5) : ""}
                  className="campo w-full"
                />
              </div>
              <div>
                <label className="rotulo mb-1.5">
                  Link da reunião (opcional)
                </label>
                <input
                  type="url"
                  name="link_reuniao"
                  defaultValue={reuniao.link_reuniao ?? ""}
                  placeholder="https://meet.google.com/..."
                  className="campo w-full"
                />
              </div>
            </div>
          )}

          {!agendadaEdicao && (
            <label className="flex items-center gap-3 text-sm text-text">
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
            <label className="rotulo mb-1.5">
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
              className="campo w-full"
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
            <button type="button" onClick={() => setEditando(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="btn-secondary">
              {isPending ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li
      onClick={() => setEditando(true)}
      className="-mx-3 cursor-pointer rounded-lg border-b border-line-soft px-3 py-4 transition-colors last:border-b-0 hover:bg-hover"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="text-[14.5px] font-medium tabular-nums text-text">
            {formatDate(reuniao.data)}
            {reuniao.hora && ` às ${reuniao.hora.slice(0, 5)}`}
          </span>
          {onboardingHref && <span className="text-[13px] text-gold">Onboarding</span>}
          {!reuniao.compareceu && <span className="text-[13px] text-danger">Não compareceu</span>}
          {agendada && <span className="text-[13px] text-muted">Agendada</span>}
          {grupoOrigemNome && (
            <span
              title="Essa reunião foi agendada por outro grupo; alguém deste grupo participou como convidado."
              className="text-[13px] text-muted"
            >
              Reunião de {displayGroupName(grupoOrigemNome)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {responsavelNome && (
            <span className="text-[13px] text-muted">Conduzida por {responsavelNome}</span>
          )}
          <RowMenu
            rotulo="Mais opções da reunião"
            acoes={[
              { label: "Editar", onSelect: () => setEditando(true) },
              {
                label: "Excluir",
                destrutiva: true,
                confirmar: {
                  titulo: "Excluir esta reunião?",
                  texto: "Essa ação não pode ser desfeita.",
                  botao: "Excluir",
                },
                onSelect: async () => {
                  try {
                    await removeReuniao(reuniao.id);
                  } catch (err) {
                    if (err instanceof Error) setError(err.message);
                  }
                },
              },
            ]}
          />
        </div>
      </div>
      {error && (
        <p className="mt-2 text-xs text-danger">{error}</p>
      )}
      {reuniao.resumo && (
        <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-text-2">{reuniao.resumo}</p>
      )}
      {onboardingHref && (
        <Link
          href={onboardingHref}
          prefetch={false}
          onClick={(e) => e.stopPropagation()}
          className="link mt-2 inline-block text-[13.5px]"
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
          className="link mt-1.5 block w-fit truncate text-[13.5px]"
        >
          {reuniao.link_reuniao}
        </a>
      )}
      {agendada && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
          <a
            href={linkWhatsapp(
              mensagemConfirmacaoReuniao(grupoNome, reuniao.data, reuniao.hora)
            )}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-muted hover:text-text"
          >
            Lembrete de confirmação ↗
          </a>
          <a
            href={linkWhatsapp(
              mensagemLinkReuniao(grupoNome, reuniao.hora, reuniao.link_reuniao)
            )}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-muted hover:text-text"
          >
            Lembrete com link (10 min antes) ↗
          </a>
        </div>
      )}
      {participantes.length > 0 && (
        <p className="mt-2 text-[13px] text-subtle">
          Participantes:{" "}
          {participantes
            .map((p) => p.nome + (p.deOutroGrupo && p.grupoNome ? ` (${displayGroupName(p.grupoNome)})` : ""))
            .join(", ")}
        </p>
      )}
    </li>
  );
}
