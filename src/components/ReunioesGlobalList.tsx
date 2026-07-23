"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import {
  linkWhatsapp,
  mensagemConfirmacaoReuniao,
  mensagemLinkReuniao,
} from "@/lib/whatsapp";
import { StatusBadge } from "@/components/StatusBadge";
import type { Responsavel } from "@/lib/database.types";

type LinhaReuniao = {
  id: string;
  grupoId: string;
  grupoNome: string;
  data: string;
  hora: string | null;
  resumo: string;
  compareceu: boolean;
  linkReuniao: string | null;
  responsavelNome: string | undefined;
  participantes: string[];
};

export function ReunioesGlobalList({
  reunioes,
  grupos,
  responsaveis,
}: {
  reunioes: LinhaReuniao[];
  grupos: { id: string; nome: string }[];
  responsaveis: Responsavel[];
}) {
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [filtroResponsavel, setFiltroResponsavel] = useState("");

  const hoje = new Date().toISOString().slice(0, 10);

  const filtradas = useMemo(() => {
    return reunioes.filter((r) => {
      if (filtroGrupo && r.grupoId !== filtroGrupo) return false;
      if (filtroResponsavel && r.responsavelNome !== filtroResponsavel) return false;
      return true;
    });
  }, [reunioes, filtroGrupo, filtroResponsavel]);

  const hojeList = filtradas.filter((r) => r.data === hoje && r.compareceu);
  const proximas = filtradas
    .filter((r) => r.data > hoje && r.compareceu)
    .sort((a, b) => a.data.localeCompare(b.data));
  const historico = filtradas
    .filter((r) => !(r.data > hoje && r.compareceu) && r.data !== hoje)
    .sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-bg-surface-hover p-3">
        <div>
          <label className="mb-1 block text-xs text-text-secondary">Grupo</label>
          <select
            value={filtroGrupo}
            onChange={(e) => setFiltroGrupo(e.target.value)}
            className="rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary"
          >
            <option value="">Todos</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-secondary">
            Responsável
          </label>
          <select
            value={filtroResponsavel}
            onChange={(e) => setFiltroResponsavel(e.target.value)}
            className="rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary"
          >
            <option value="">Todos</option>
            {responsaveis.map((r) => (
              <option key={r.id} value={r.nome}>
                {r.nome}
              </option>
            ))}
          </select>
        </div>
        <p className="ml-auto text-sm text-text-secondary">
          {filtradas.length} reuni{filtradas.length === 1 ? "ão" : "ões"}
        </p>
      </div>

      {hojeList.length > 0 && (
        <Secao titulo="Hoje" itens={hojeList} />
      )}
      {proximas.length > 0 && (
        <Secao titulo="Próximas reuniões" itens={proximas} />
      )}
      <Secao titulo="Histórico" itens={historico} vazio="Nenhuma reunião no histórico." />
    </div>
  );
}

function Secao({
  titulo,
  itens,
  vazio,
}: {
  titulo: string;
  itens: LinhaReuniao[];
  vazio?: string;
}) {
  return (
    <div>
      <h2 className="mb-2 font-display text-lg font-semibold text-text-primary">
        {titulo}
      </h2>
      {itens.length === 0 ? (
        <p className="text-sm text-text-secondary">{vazio}</p>
      ) : (
        <ul className="space-y-3">
          {itens.map((r) => (
            <ReuniaoGlobalItem key={r.id} reuniao={r} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ReuniaoGlobalItem({ reuniao: r }: { reuniao: LinhaReuniao }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const agendada = r.data > hoje && r.compareceu;
  const hojeFlag = r.data === hoje && r.compareceu;

  return (
    <li className="rounded-xl border border-border bg-bg-surface p-5">
      <Link
        href={`/grupos/${r.grupoId}/reunioes`}
        prefetch={false}
        className="flex flex-wrap items-center justify-between gap-2 hover:opacity-80"
      >
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-text-primary">
            {formatDate(r.data)}
            {r.hora && ` às ${r.hora.slice(0, 5)}`}
          </p>
          <span className="rounded-full bg-status-accent-bg px-2 py-0.5 text-xs font-medium text-status-accent-text">
            {r.grupoNome}
          </span>
          {!r.compareceu && (
            <span className="rounded-full bg-status-alert-bg px-2 py-0.5 text-xs font-medium text-status-alert-text">
              Não compareceu
            </span>
          )}
          {(agendada || hojeFlag) && (
            <span className="rounded-full bg-status-ok-bg px-2 py-0.5 text-xs font-medium text-status-ok-text">
              {hojeFlag ? "Hoje" : "Agendada"}
            </span>
          )}
        </div>
        {r.responsavelNome && (
          <span className="rounded-full bg-bg-surface-hover px-2 py-0.5 text-xs text-text-secondary">
            Conduzida por {r.responsavelNome}
          </span>
        )}
      </Link>

      {r.resumo && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">
          {r.resumo}
        </p>
      )}
      {r.linkReuniao && (
        <a
          href={r.linkReuniao}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm text-accent hover:text-accent-hover"
        >
          {r.linkReuniao}
        </a>
      )}
      {(agendada || hojeFlag) && (
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={linkWhatsapp(
              mensagemConfirmacaoReuniao(r.grupoNome, r.data, r.hora)
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-border px-2.5 py-1 text-xs text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary"
          >
            Lembrete de confirmação
          </a>
          <a
            href={linkWhatsapp(
              mensagemLinkReuniao(r.grupoNome, r.hora, r.linkReuniao)
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-border px-2.5 py-1 text-xs text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary"
          >
            Lembrete com link (10 min antes)
          </a>
        </div>
      )}
      {r.participantes.length > 0 && (
        <p className="mt-3 text-xs text-text-secondary">
          Participantes: {r.participantes.join(", ")}
        </p>
      )}
    </li>
  );
}
