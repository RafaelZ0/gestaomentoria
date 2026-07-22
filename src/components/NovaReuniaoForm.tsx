"use client";

import { useState, useTransition } from "react";
import { createReuniao } from "@/app/actions/reunioes";
import { ResponsavelField } from "@/components/ResponsavelField";
import { ParticipantesFields } from "@/components/ParticipantesFields";
import type { Responsavel } from "@/lib/database.types";

type MentoradoOutroGrupo = {
  id: string;
  nome: string;
  grupoNome: string;
  grupoStatus: string;
  grupoDataTermino: string | null;
};

export function NovaReuniaoForm({
  grupoId,
  entregasPendentes,
  mentoradosDoGrupo,
  grupoStatus,
  grupoDataTermino,
  mentoradosOutrosGrupos,
  responsaveis,
}: {
  grupoId: string;
  entregasPendentes: { id: string; nome: string }[];
  mentoradosDoGrupo: { id: string; nome: string }[];
  grupoStatus: string;
  grupoDataTermino: string | null;
  mentoradosOutrosGrupos: MentoradoOutroGrupo[];
  responsaveis: Responsavel[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [entregaFoiFeita, setEntregaFoiFeita] = useState<"sim" | "nao" | null>(null);
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [naoCompareceu, setNaoCompareceu] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
      >
        + Nova reunião
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            await createReuniao(grupoId, formData);
            setOpen(false);
          } catch (e) {
            if (e instanceof Error) setError(e.message);
          }
        });
      }}
      className="space-y-4 rounded-xl border border-border bg-bg-surface p-6"
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
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
          />
        </div>

        <ResponsavelField responsaveis={responsaveis} />
      </div>

      <label className="flex items-center gap-3 rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-sm text-text-primary">
        <input
          type="checkbox"
          name="nao_compareceu"
          checked={naoCompareceu}
          onChange={(e) => setNaoCompareceu(e.target.checked)}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        Grupo não compareceu à reunião agendada
      </label>

      <div>
        <label className="mb-1 block text-sm text-text-secondary">
          {naoCompareceu
            ? "Observação (opcional)"
            : "O que foi conversado e definido"}
        </label>
        <textarea
          name="resumo"
          required={!naoCompareceu}
          rows={naoCompareceu ? 2 : 4}
          className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
        />
      </div>

      {!naoCompareceu && (
        <ParticipantesFields
          mentoradosDoGrupo={mentoradosDoGrupo}
          grupoStatus={grupoStatus}
          grupoDataTermino={grupoDataTermino}
          mentoradosOutrosGrupos={mentoradosOutrosGrupos}
          dataReuniao={data}
        />
      )}

      {!naoCompareceu && entregasPendentes.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-text-secondary">
            Alguma entrega foi feita nesta reunião?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEntregaFoiFeita("sim")}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                entregaFoiFeita === "sim"
                  ? "border-accent bg-accent text-white"
                  : "border-border text-text-secondary hover:bg-bg-surface-hover"
              }`}
            >
              Sim
            </button>
            <button
              type="button"
              onClick={() => setEntregaFoiFeita("nao")}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                entregaFoiFeita === "nao"
                  ? "border-accent bg-accent text-white"
                  : "border-border text-text-secondary hover:bg-bg-surface-hover"
              }`}
            >
              Não
            </button>
          </div>

          {entregaFoiFeita === "sim" && (
            <div className="mt-3 space-y-2">
              {entregasPendentes.map((e) => (
                <label
                  key={e.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-sm text-text-primary"
                >
                  <input
                    type="checkbox"
                    name="entrega_feita"
                    value={e.id}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  {e.nome}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {isPending ? "Salvando…" : "Registrar reunião"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn-secondary"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
