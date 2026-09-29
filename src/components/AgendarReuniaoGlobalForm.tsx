"use client";

import { useEffect, useState, useTransition } from "react";
import { createReuniao } from "@/app/actions/reunioes";
import { displayGroupName } from "@/lib/format";
import { ResponsavelField } from "@/components/ResponsavelField";
import type { Responsavel } from "@/lib/database.types";

function amanha() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// Botão "Agendar reunião" (ação principal da página Reuniões) + formulário
// em modal.
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

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-primary">
        Agendar reunião
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setOpen(false)}
        >
          <form
            role="dialog"
            aria-label="Agendar reunião"
            onClick={(e) => e.stopPropagation()}
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
            className="max-h-[calc(100dvh-2rem)] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl border border-line bg-surface p-6 shadow-2xl"
          >
            <h2 className="text-[17px] font-semibold text-text">Agendar reunião</h2>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div>
              <label className="rotulo mb-1.5">Grupo</label>
              <select
                required
                value={grupoId}
                onChange={(e) => setGrupoId(e.target.value)}
                className="campo"
              >
                <option value="">Selecione um grupo…</option>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>
                    {displayGroupName(g.nome)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="rotulo mb-1.5">Data</label>
                <input
                  type="date"
                  name="data"
                  defaultValue={amanha()}
                  min={amanha()}
                  className="campo"
                />
              </div>
              <div>
                <label className="rotulo mb-1.5">Horário (opcional)</label>
                <input type="time" name="hora" className="campo" />
              </div>
              <ResponsavelField responsaveis={responsaveis} />
            </div>

            <div>
              <label className="rotulo mb-1.5">Link da reunião (opcional)</label>
              <input
                type="url"
                name="link_reuniao"
                placeholder="https://meet.google.com/..."
                className="campo"
              />
            </div>

            <div>
              <label className="rotulo mb-1.5">Pauta / observação (opcional)</label>
              <textarea name="resumo" rows={2} className="campo" />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={isPending} className="btn-primary">
                {isPending ? "Salvando…" : "Agendar reunião"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
