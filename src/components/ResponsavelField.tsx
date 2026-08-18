"use client";

import { useState, useTransition } from "react";
import { addResponsavel } from "@/app/actions/responsaveis";
import type { Responsavel } from "@/lib/database.types";

export function ResponsavelField({
  responsaveis,
  defaultResponsavelId = "",
  label = "Quem conduziu a reunião",
}: {
  responsaveis: Responsavel[];
  defaultResponsavelId?: string;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [novoResponsavel, setNovoResponsavel] = useState(false);
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [listaResponsaveis, setListaResponsaveis] = useState(responsaveis);
  const [responsavelId, setResponsavelId] = useState(defaultResponsavelId);

  return (
    <div>
      <label className="mb-1 block text-sm text-text-secondary">
        {label}
      </label>
      {error && <p className="mb-1 text-xs text-status-alert-text">{error}</p>}
      {!novoResponsavel ? (
        <div className="flex gap-2">
          <select
            name="responsavel_id"
            value={responsavelId}
            onChange={(e) => setResponsavelId(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
          >
            <option value="">—</option>
            {listaResponsaveis.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setNovoResponsavel(true)}
            className="whitespace-nowrap rounded-lg border border-border px-3 py-2 text-xs text-text-secondary hover:bg-bg-surface-hover"
          >
            + Novo
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            autoFocus
            value={nomeResponsavel}
            onChange={(e) => setNomeResponsavel(e.target.value)}
            placeholder="Nome do responsável"
            className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
          />
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                try {
                  const responsavel = await addResponsavel(nomeResponsavel);
                  setListaResponsaveis((atual) => [...atual, responsavel]);
                  setResponsavelId(responsavel.id);
                  setNomeResponsavel("");
                  setNovoResponsavel(false);
                } catch (e) {
                  if (e instanceof Error) setError(e.message);
                }
              })
            }
            className="whitespace-nowrap rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-60"
          >
            Salvar
          </button>
        </div>
      )}
    </div>
  );
}
