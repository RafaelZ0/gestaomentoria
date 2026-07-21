"use client";

import { useState } from "react";

type MentoradoOutroGrupo = { id: string; nome: string; grupoNome: string };

export function ParticipantesFields({
  mentoradosDoGrupo,
  mentoradosOutrosGrupos,
  participantesSelecionados = new Set(),
}: {
  mentoradosDoGrupo: { id: string; nome: string }[];
  mentoradosOutrosGrupos: MentoradoOutroGrupo[];
  participantesSelecionados?: Set<string>;
}) {
  const temOutroSelecionado = mentoradosOutrosGrupos.some((m) =>
    participantesSelecionados.has(m.id)
  );
  const [mostrarOutrosGrupos, setMostrarOutrosGrupos] = useState(temOutroSelecionado);

  const gruposOutros = new Map<string, MentoradoOutroGrupo[]>();
  for (const m of mentoradosOutrosGrupos) {
    const lista = gruposOutros.get(m.grupoNome) ?? [];
    lista.push(m);
    gruposOutros.set(m.grupoNome, lista);
  }

  return (
    <div>
      <p className="mb-2 text-sm text-text-secondary">Quem participou</p>
      <div className="space-y-2">
        {mentoradosDoGrupo.map((m) => (
          <label
            key={m.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-sm text-text-primary"
          >
            <input
              type="checkbox"
              name="participante_id"
              value={m.id}
              defaultChecked={participantesSelecionados.has(m.id)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            {m.nome}
          </label>
        ))}
        {mentoradosDoGrupo.length === 0 && (
          <p className="text-sm text-text-secondary">
            Nenhum mentorado cadastrado neste grupo.
          </p>
        )}
      </div>

      {mentoradosOutrosGrupos.length > 0 && (
        <div className="mt-3">
          {!mostrarOutrosGrupos ? (
            <button
              type="button"
              onClick={() => setMostrarOutrosGrupos(true)}
              className="text-sm text-accent hover:text-accent-hover"
            >
              + Adicionar pessoa de outro grupo
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-text-secondary">
                A reunião também aparecerá na aba Reuniões do grupo dessa pessoa.
              </p>
              {[...gruposOutros.entries()].map(([grupoNome, mentorados]) => (
                <div key={grupoNome}>
                  <p className="mb-1 text-xs font-medium text-text-secondary">
                    {grupoNome}
                  </p>
                  <div className="space-y-2">
                    {mentorados.map((m) => (
                      <label
                        key={m.id}
                        className="flex items-center gap-3 rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-sm text-text-primary"
                      >
                        <input
                          type="checkbox"
                          name="participante_id"
                          value={m.id}
                          defaultChecked={participantesSelecionados.has(m.id)}
                          className="h-4 w-4 accent-[var(--accent)]"
                        />
                        {m.nome}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
