"use client";

import { useState, useTransition } from "react";
import { createReuniao } from "@/app/actions/reunioes";
import { ResponsavelField } from "@/components/ResponsavelField";
import type { Responsavel } from "@/lib/database.types";

function amanha() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function AgendarReuniaoGlobalForm({
  grupos,
  responsaveis,
}: {
  grupos: { id: string; nome: string }[];
  responsaveis: Responsavel[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [grupoId, setGrupoId] = useState("");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
      >
        + Agendar reunião
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        if (!grupoId) {
          setError("Escolha o grupo.");
          return;
        }
        startTransition(async () => {
          try {
            await createReuniao(grupoId, formData);
            setOpen(false);
            setGrupoId("");
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

      <div>
        <label className="mb-1 block text-sm text-text-secondary">Grupo</label>
        <select
          required
          value={grupoId}
          onChange={(e) => setGrupoId(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
        >
          <option value="">Selecione um grupo…</option>
          {grupos.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm text-text-secondary">Data</label>
          <input
            type="date"
            name="data"
            defaultValue={amanha()}
            min={amanha()}
            className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-secondary">
            Horário (opcional)
          </label>
          <input
            type="time"
            name="hora"
            className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
          />
        </div>
        <ResponsavelField responsaveis={responsaveis} />
      </div>

      <div>
        <label className="mb-1 block text-sm text-text-secondary">
          Link da reunião (opcional)
        </label>
        <input
          type="url"
          name="link_reuniao"
          placeholder="https://meet.google.com/..."
          className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-text-secondary">
          Pauta / observação (opcional)
        </label>
        <textarea
          name="resumo"
          rows={2}
          className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {isPending ? "Salvando…" : "Agendar reunião"}
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
