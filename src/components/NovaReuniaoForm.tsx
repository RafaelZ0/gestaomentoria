"use client";

import { useState, useTransition } from "react";
import { createReuniao } from "@/app/actions/reunioes";
import { ResponsavelField } from "@/components/ResponsavelField";
import { ParticipantesFields } from "@/components/ParticipantesFields";
import type { Responsavel } from "@/lib/database.types";

type MentoradoOutroGrupo = { id: string; nome: string; grupoNome: string };

export function NovaReuniaoForm({
  grupoId,
  entregasPendentes,
  mentoradosDoGrupo,
  mentoradosOutrosGrupos,
  responsaveis,
}: {
  grupoId: string;
  entregasPendentes: { id: string; nome: string }[];
  mentoradosDoGrupo: { id: string; nome: string }[];
  mentoradosOutrosGrupos: MentoradoOutroGrupo[];
  responsaveis: Responsavel[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
          />
        </div>

        <ResponsavelField responsaveis={responsaveis} />
      </div>

      <div>
        <label className="mb-1 block text-sm text-text-secondary">
          O que foi conversado e definido
        </label>
        <textarea
          name="resumo"
          required
          rows={4}
          className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
        />
      </div>

      <ParticipantesFields
        mentoradosDoGrupo={mentoradosDoGrupo}
        mentoradosOutrosGrupos={mentoradosOutrosGrupos}
      />

      {entregasPendentes.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-text-secondary">
            Entregas feitas nesta reunião (opcional)
          </p>
          <div className="space-y-2">
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
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-bg-surface-hover"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
