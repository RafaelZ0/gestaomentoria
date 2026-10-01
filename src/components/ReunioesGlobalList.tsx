"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { displayGroupName, formatDate, formatMesAno } from "@/lib/format";
import {
  linkWhatsapp,
  mensagemConfirmacaoReuniao,
  mensagemLinkReuniao,
} from "@/lib/whatsapp";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import type { Responsavel } from "@/lib/database.types";

type LinhaReuniao = {
  id: string;
  grupoId: string;
  grupoNome: string;
  grupoStatus: string;
  data: string;
  hora: string | null;
  resumo: string;
  compareceu: boolean;
  linkReuniao: string | null;
  responsavelNome: string | undefined;
  participantes: string[];
};

type FiltroStatus = "Ativo" | "Inativo" | "todos";

export function ReunioesGlobalList({
  reunioes,
  responsaveis,
}: {
  reunioes: LinhaReuniao[];
  responsaveis: Responsavel[];
}) {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("Ativo");
  const [filtroResponsavel, setFiltroResponsavel] = useState("");

  const hoje = new Date().toISOString().slice(0, 10);

  const filtradas = useMemo(() => {
    const buscaNormalizada = busca.trim().toLowerCase();
    return reunioes.filter((r) => {
      if (filtroStatus !== "todos" && r.grupoStatus !== filtroStatus) return false;
      if (filtroResponsavel && r.responsavelNome !== filtroResponsavel) return false;
      if (
        buscaNormalizada &&
        !r.grupoNome.toLowerCase().includes(buscaNormalizada) &&
        !displayGroupName(r.grupoNome).toLowerCase().includes(buscaNormalizada)
      ) {
        return false;
      }
      return true;
    });
  }, [reunioes, busca, filtroStatus, filtroResponsavel]);

  const hojeList = filtradas.filter((r) => r.data === hoje && r.compareceu);
  const proximas = filtradas
    .filter((r) => r.data > hoje && r.compareceu)
    .sort((a, b) => a.data.localeCompare(b.data));
  const historico = filtradas
    .filter((r) => !(r.data > hoje && r.compareceu) && r.data !== hoje)
    .sort((a, b) => b.data.localeCompare(a.data));

  const historicoPorMes = useMemo(() => {
    const m = new Map<string, LinhaReuniao[]>();
    for (const r of historico) {
      const chave = r.data.slice(0, 7);
      const lista = m.get(chave) ?? [];
      lista.push(r);
      m.set(chave, lista);
    }
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [historico]);

  return (
    <div className="flex flex-col gap-9">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            rotulo="Status do grupo"
            valor={filtroStatus}
            onChange={setFiltroStatus}
            opcoes={[
              { valor: "Ativo", label: "Ativos" },
              { valor: "Inativo", label: "Inativos" },
              { valor: "todos", label: "Todos" },
            ]}
          />
          <select
            value={filtroResponsavel}
            onChange={(e) => setFiltroResponsavel(e.target.value)}
            aria-label="Responsável"
            className="h-9 rounded-[10px] border-0 bg-surface px-3 text-[13.5px] text-text-2"
          >
            <option value="">Todos os responsáveis</option>
            {responsaveis.map((r) => (
              <option key={r.id} value={r.nome}>
                {r.nome}
              </option>
            ))}
          </select>
          <span className="text-[13px] text-muted">
            {filtradas.length} reuni{filtradas.length === 1 ? "ão" : "ões"}
          </span>
        </div>
        <label className="flex h-9 w-full items-center gap-2 rounded-[10px] bg-surface px-3 text-subtle focus-within:ring-2 focus-within:ring-gold/40 sm:w-[260px]">
          <Icon nome="busca" tamanho={16} traco={1.8} />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar grupo"
            aria-label="Buscar grupo"
            className="w-full border-0 bg-transparent text-sm text-text shadow-none outline-none placeholder:text-subtle focus:shadow-none"
          />
        </label>
      </div>

      {hojeList.length > 0 && <Secao titulo="Hoje" itens={hojeList} />}
      {proximas.length > 0 && <Secao titulo="Próximas reuniões" itens={proximas} />}

      <section className="flex flex-col gap-5">
        <h2 className="text-[15px] font-semibold text-text">Histórico</h2>
        {historicoPorMes.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma reunião no histórico com esse filtro.</p>
        ) : (
          historicoPorMes.map(([mes, itens]) => {
            const [ano, m] = mes.split("-").map(Number);
            return (
              <div key={mes} className="flex flex-col">
                <div className="flex items-baseline justify-between border-b border-line pb-2">
                  <h3 className="text-[13.5px] font-medium text-text-2">{formatMesAno(ano, m)}</h3>
                  <span className="text-[13px] text-muted">
                    {itens.length} reuni{itens.length === 1 ? "ão" : "ões"}
                  </span>
                </div>
                {itens.map((r) => (
                  <ReuniaoGlobalItem key={r.id} reuniao={r} />
                ))}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

function Secao({ titulo, itens }: { titulo: string; itens: LinhaReuniao[] }) {
  return (
    <section className="flex flex-col">
      <h2 className="border-b border-line pb-2 text-[15px] font-semibold text-text">{titulo}</h2>
      {itens.map((r) => (
        <ReuniaoGlobalItem key={r.id} reuniao={r} />
      ))}
    </section>
  );
}

function ReuniaoGlobalItem({ reuniao: r }: { reuniao: LinhaReuniao }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const agendada = r.data > hoje && r.compareceu;
  const hojeFlag = r.data === hoje && r.compareceu;
  const nome = displayGroupName(r.grupoNome);

  return (
    <article className="flex flex-col gap-1.5 border-b border-line-soft py-4 last:border-b-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Link
          href={`/grupos/${r.grupoId}/reunioes`}
          prefetch={false}
          className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 hover:opacity-80"
        >
          <span className="w-[140px] shrink-0 text-[14px] tabular-nums text-text-2">
            {hojeFlag ? <span className="text-gold">Hoje</span> : formatDate(r.data)}
            {r.hora && ` às ${r.hora.slice(0, 5)}`}
          </span>
          <span className="text-[14.5px] font-medium text-text">{nome}</span>
          {agendada && <span className="text-[13px] text-muted">Agendada</span>}
          {r.grupoStatus === "Inativo" && (
            <span className="text-[13px] text-muted">Grupo inativo</span>
          )}
          {!r.compareceu && <span className="text-[13px] text-danger">Não compareceu</span>}
        </Link>
        {r.responsavelNome && (
          <span className="text-[13px] text-muted">Conduzida por {r.responsavelNome}</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 min-[640px]:pl-[152px]">
        {r.resumo && (
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-text-2">{r.resumo}</p>
        )}
        {r.linkReuniao && (
          <a
            href={r.linkReuniao}
            target="_blank"
            rel="noopener noreferrer"
            className="link w-fit truncate text-[13.5px]"
          >
            {r.linkReuniao}
          </a>
        )}
        {(agendada || hojeFlag) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
            <a
              href={linkWhatsapp(mensagemConfirmacaoReuniao(r.grupoNome, r.data, r.hora))}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-text"
            >
              Lembrete de confirmação ↗
            </a>
            <a
              href={linkWhatsapp(mensagemLinkReuniao(r.grupoNome, r.hora, r.linkReuniao))}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-text"
            >
              Lembrete com link (10 min antes) ↗
            </a>
          </div>
        )}
        {r.participantes.length > 0 && (
          <p className="text-[13px] text-muted">Participantes: {r.participantes.join(", ")}</p>
        )}
      </div>
    </article>
  );
}
