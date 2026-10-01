"use client";

import { useState, useTransition } from "react";
import { createReuniao } from "@/app/actions/reunioes";
import { displayProcessName } from "@/lib/format";
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
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary w-fit">
        Nova reunião
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
      className="flex flex-col gap-4 border-y border-line py-6"
    >
      <h2 className="text-[15px] font-semibold text-text">Nova reunião</h2>
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

        <ResponsavelField responsaveis={responsaveis} />
      </div>

      {agendada && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="rotulo mb-1.5">
              Horário (opcional)
            </label>
            <input
              type="time"
              name="hora"
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
              placeholder="https://meet.google.com/..."
              className="campo w-full"
            />
          </div>
        </div>
      )}

      {!agendada && (
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
          className="campo w-full"
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
          <div className="inline-flex gap-1 rounded-[10px] bg-surface p-[3px]">
            {(["sim", "nao"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={entregaFoiFeita === v}
                onClick={() => setEntregaFoiFeita(v)}
                className={`h-[30px] rounded-lg px-4 text-[13.5px] transition-colors ${
                  entregaFoiFeita === v ? "bg-raised text-text" : "text-muted hover:text-text"
                }`}
              >
                {v === "sim" ? "Sim" : "Não"}
              </button>
            ))}
          </div>

          {entregaFoiFeita === "sim" && (
            <div className="mt-3 flex flex-col">
              {entregasPendentes.map((e) => (
                <label
                  key={e.id}
                  className="flex min-h-10 items-center gap-3 border-b border-line-soft text-sm text-text last:border-b-0"
                >
                  <input
                    type="checkbox"
                    name="entrega_feita"
                    value={e.id}
                    className="h-4 w-4"
                  />
                  {displayProcessName(e.nome)}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" disabled={isPending} className="btn-secondary">
          {isPending ? "Salvando…" : agendada ? "Agendar reunião" : "Registrar reunião"}
        </button>
      </div>
    </form>
  );
}
