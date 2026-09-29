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
      <label className="rotulo mb-1.5">{label}</label>
      {error && <p className="mb-1 text-xs text-danger">{error}</p>}
      {!novoResponsavel ? (
        <div className="flex gap-2">
          <select
            name="responsavel_id"
            value={responsavelId}
            onChange={(e) => setResponsavelId(e.target.value)}
            className="campo"
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
            className="btn-secondary px-3 text-[13px]"
          >
            Novo
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            autoFocus
            value={nomeResponsavel}
            onChange={(e) => setNomeResponsavel(e.target.value)}
            placeholder="Nome do responsável"
            className="campo"
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
            className="btn-secondary px-3 text-[13px]"
          >
            Salvar
          </button>
        </div>
      )}
    </div>
  );
}
