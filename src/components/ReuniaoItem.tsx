"use client";

import { useState, useTransition } from "react";
import { formatDate } from "@/lib/format";
import { updateReuniao, removeReuniao } from "@/app/actions/reunioes";
import { ResponsavelField } from "@/components/ResponsavelField";
import { ParticipantesFields } from "@/components/ParticipantesFields";
import type { Responsavel } from "@/lib/database.types";

type Participante = {
  id: string;
  nome: string;
  grupoNome: string;
  deOutroGrupo: boolean;
};

export function ReuniaoItem({
  reuniao,
  participantes,
  responsavelNome,
  mentoradosDoGrupo,
  mentoradosOutrosGrupos,
  responsaveis,
}: {
  reuniao: { id: string; data: string; resumo: string; responsavel_id: string | null };
  participantes: Participante[];
  responsavelNome: string | undefined;
  mentoradosDoGrupo: { id: string; nome: string }[];
  mentoradosOutrosGrupos: { id: string; nome: string; grupoNome: string }[];
  responsaveis: Responsavel[];
}) {
  const [editando, setEditando] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (editando) {
    const participantesIds = new Set(participantes.map((p) => p.id));

    return (
      <li className="rounded-xl border border-border bg-bg-surface p-5">
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
            <div className="rounded-lg bg-status-alert-bg px-3 py-2 text-sm text-status-alert-text">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-text-secondary">Data</label>
              <input
                type="date"
                name="data"
                defaultValue={reuniao.data}
                className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
              />
            </div>
            <ResponsavelField
              responsaveis={responsaveis}
              defaultResponsavelId={reuniao.responsavel_id ?? ""}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-text-secondary">
              O que foi conversado e definido
            </label>
            <textarea
              name="resumo"
              required
              rows={4}
              defaultValue={reuniao.resumo}
              className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
            />
          </div>

          <ParticipantesFields
            mentoradosDoGrupo={mentoradosDoGrupo}
            mentoradosOutrosGrupos={mentoradosOutrosGrupos}
            participantesSelecionados={participantesIds}
          />

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
              onClick={() => setEditando(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-bg-surface-hover"
            >
              Cancelar
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-border bg-bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-text-primary">{formatDate(reuniao.data)}</p>
        <div className="flex items-center gap-3">
          {responsavelNome && (
            <span className="rounded-full bg-bg-surface-hover px-2 py-0.5 text-xs text-text-secondary">
              Conduzida por {responsavelNome}
            </span>
          )}
          <button
            onClick={() => setEditando(true)}
            className="text-xs text-text-secondary hover:text-text-primary"
          >
            Editar
          </button>
          <button
            disabled={isPending}
            onClick={() => {
              if (!confirm("Excluir esta reunião? Essa ação não pode ser desfeita.")) {
                return;
              }
              startTransition(async () => {
                try {
                  await removeReuniao(reuniao.id);
                } catch (e) {
                  if (e instanceof Error) setError(e.message);
                }
              });
            }}
            className="text-xs text-text-secondary hover:text-status-alert-text disabled:opacity-60"
          >
            Excluir
          </button>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-xs text-status-alert-text">{error}</p>
      )}
      <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{reuniao.resumo}</p>
      {participantes.length > 0 && (
        <p className="mt-3 text-xs text-text-secondary">
          Participantes:{" "}
          {participantes
            .map((p) => p.nome + (p.deOutroGrupo && p.grupoNome ? ` (${p.grupoNome})` : ""))
            .join(", ")}
        </p>
      )}
    </li>
  );
}
