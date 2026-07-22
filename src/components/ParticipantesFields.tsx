"use client";

import { useState } from "react";

type MentoradoOutroGrupo = {
  id: string;
  nome: string;
  grupoNome: string;
  grupoStatus: string;
  grupoDataTermino: string | null;
};

function visivelNaData(
  status: string,
  dataTermino: string | null,
  dataReuniao: string
): boolean {
  if (status !== "Inativo") return true;
  if (!dataTermino || !dataReuniao) return true;
  return dataReuniao <= dataTermino;
}

export function ParticipantesFields({
  mentoradosDoGrupo,
  grupoStatus = "Ativo",
  grupoDataTermino = null,
  mentoradosOutrosGrupos,
  dataReuniao = "",
  participantesSelecionados = new Set(),
}: {
  mentoradosDoGrupo: { id: string; nome: string }[];
  grupoStatus?: string;
  grupoDataTermino?: string | null;
  mentoradosOutrosGrupos: MentoradoOutroGrupo[];
  dataReuniao?: string;
  participantesSelecionados?: Set<string>;
}) {
  const temOutroSelecionado = mentoradosOutrosGrupos.some((m) =>
    participantesSelecionados.has(m.id)
  );
  const [mostrarOutrosGrupos, setMostrarOutrosGrupos] = useState(temOutroSelecionado);

  const mentoradosDoGrupoVisiveis = mentoradosDoGrupo.filter(
    (m) =>
      participantesSelecionados.has(m.id) ||
      visivelNaData(grupoStatus, grupoDataTermino, dataReuniao)
  );

  const mentoradosOutrosVisiveis = mentoradosOutrosGrupos.filter(
    (m) =>
      participantesSelecionados.has(m.id) ||
      visivelNaData(m.grupoStatus, m.grupoDataTermino, dataReuniao)
  );

  const gruposOutros = new Map<string, MentoradoOutroGrupo[]>();
  for (const m of mentoradosOutrosVisiveis) {
    const lista = gruposOutros.get(m.grupoNome) ?? [];
    lista.push(m);
    gruposOutros.set(m.grupoNome, lista);
  }

  return (
    <div>
      <p className="mb-2 text-sm text-text-secondary">Quem participou</p>
      <div className="space-y-2">
        {mentoradosDoGrupoVisiveis.map((m) => (
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
        {mentoradosDoGrupoVisiveis.length === 0 && (
          <p className="text-sm text-text-secondary">
            {mentoradosDoGrupo.length === 0
              ? "Nenhum mentorado cadastrado neste grupo."
              : "Grupo inativo antes dessa data — nenhum mentorado disponível."}
          </p>
        )}
      </div>

      {mentoradosOutrosVisiveis.length > 0 && (
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
