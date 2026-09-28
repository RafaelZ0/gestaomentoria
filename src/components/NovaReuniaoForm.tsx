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
  const hoje = new Date().toISOString().slice(0, 10);
  const [data, setData] = useState(hoje);
  const [naoCompareceu, setNaoCompareceu] = useState(false);
  const agendada = data > hoje;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-on-gold hover:bg-gold-hover"
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
      className="space-y-4 rounded-xl border border-line bg-surface p-6"
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

        <ResponsavelField responsaveis={responsaveis} />
      </div>

      {agendada && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-text-2">
              Horário (opcional)
            </label>
            <input
              type="time"
              name="hora"
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
              placeholder="https://meet.google.com/..."
              className="w-full rounded-lg border border-line bg-hover px-3 py-2 text-text outline-none focus:border-gold"
            />
          </div>
        </div>
      )}

      {!agendada && (
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
          {agendada
            ? "Pauta / observação (opcional)"
            : naoCompareceu
              ? "Observação (opcional)"
              : "O que foi conversado e definido"}
        </label>
        <textarea
          name="resumo"
          required={!agendada && !naoCompareceu}
          rows={agendada || naoCompareceu ? 2 : 4}
          className="w-full rounded-lg border border-line bg-hover px-3 py-2 text-text outline-none focus:border-gold"
        />
      </div>

      {!agendada && !naoCompareceu && (
        <ParticipantesFields
          mentoradosDoGrupo={mentoradosDoGrupo}
          grupoStatus={grupoStatus}
          grupoDataTermino={grupoDataTermino}
          mentoradosOutrosGrupos={mentoradosOutrosGrupos}
          dataReuniao={data}
        />
      )}

      {!agendada && !naoCompareceu && entregasPendentes.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-text-2">
            Alguma entrega foi feita nesta reunião?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEntregaFoiFeita("sim")}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                entregaFoiFeita === "sim"
                  ? "border-gold bg-gold text-on-gold"
                  : "border-line text-text-2 hover:bg-hover"
              }`}
            >
              Sim
            </button>
            <button
              type="button"
              onClick={() => setEntregaFoiFeita("nao")}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                entregaFoiFeita === "nao"
                  ? "border-gold bg-gold text-on-gold"
                  : "border-line text-text-2 hover:bg-hover"
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
                  className="flex items-center gap-3 rounded-lg border border-line bg-hover px-3 py-2 text-sm text-text"
                >
                  <input
                    type="checkbox"
                    name="entrega_feita"
                    value={e.id}
                    className="h-4 w-4"
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
          className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-on-gold hover:bg-gold-hover disabled:opacity-60"
        >
          {isPending ? "Salvando…" : agendada ? "Agendar reunião" : "Registrar reunião"}
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
