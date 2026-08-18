"use client";

import { useState, useTransition } from "react";
import { createReuniao } from "@/app/actions/reunioes";

export function AgendarSlotForm({
  data,
  hora,
  pabloId,
  grupos,
  onCancel,
  onAgendado,
}: {
  data: string;
  hora: string;
  pabloId: string;
  grupos: { id: string; nome: string }[];
  onCancel: () => void;
  onAgendado: () => void;
}) {
  const [grupoId, setGrupoId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
            onAgendado();
          } catch (e) {
            if (e instanceof Error) setError(e.message);
          }
        });
      }}
      className="space-y-3 rounded-lg border border-accent/40 bg-bg-surface-hover p-4"
    >
      <input type="hidden" name="data" value={data} />
      <input type="hidden" name="hora" value={hora} />
      <input type="hidden" name="responsavel_id" value={pabloId} />

      {error && (
        <div className="rounded-lg bg-status-alert-bg px-3 py-2 text-xs text-status-alert-text">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs text-text-secondary">
          Agendar {hora} — Grupo
        </label>
        <select
          required
          value={grupoId}
          onChange={(e) => setGrupoId(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
        >
          <option value="">Selecione um grupo…</option>
          {grupos.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-text-secondary">
          Link da reunião (opcional)
        </label>
        <input
          name="link_reuniao"
          type="url"
          placeholder="https://meet.google.com/..."
          className="w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-text-secondary">
          Pauta / observação (opcional)
        </label>
        <textarea
          name="resumo"
          rows={2}
          className="w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {isPending ? "Agendando…" : `Confirmar às ${hora}`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-surface"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
