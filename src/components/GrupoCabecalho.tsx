"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { cancelarGrupo, reativarGrupo } from "@/app/actions/grupos";
import { displayGroupName, formatDate } from "@/lib/format";
import { AgendarReuniaoModal } from "@/components/AgendarReuniaoModal";
import { StatusDot, tomStatusGrupo, type Tom } from "@/components/ui/StatusDot";
import { ConfirmDialog, RowMenu } from "@/components/ui/RowMenu";
import type { StatusSaude } from "@/lib/saude";

const SAUDE: Record<StatusSaude, { label: string; tom: Tom }> = {
  ok: { label: "Saudável", tom: "ok" },
  warn: { label: "Atenção", tom: "warn" },
  alert: { label: "Saúde crítica", tom: "danger" },
};

function minusculaInicial(s: string) {
  return s.charAt(0).toLocaleLowerCase("pt-BR") + s.slice(1);
}

export function GrupoCabecalho({
  grupo,
  saude,
  responsaveis,
  pabloId,
  hoje,
}: {
  grupo: { id: string; nome: string; status: string; data_termino: string | null };
  saude: { status: StatusSaude; flags: string[] };
  responsaveis: { id: string; nome: string }[];
  pabloId: string | null;
  hoje: string;
}) {
  const [agendando, setAgendando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [dataCancelamento, setDataCancelamento] = useState(hoje);
  const [isPending, startTransition] = useTransition();
  const ativo = grupo.status === "Ativo";
  const s = SAUDE[saude.status];

  return (
    <div className="flex flex-col gap-3.5">
      <Link href="/grupos" prefetch={false} className="w-fit text-[13px] text-subtle hover:text-text">
        Grupos de gestão
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex min-w-0 flex-col gap-2.5">
          <h1 className="font-serif text-[32px] font-medium leading-tight tracking-[-0.015em] text-text min-[900px]:text-[38px]">
            {displayGroupName(grupo.nome)}
          </h1>
          <div className="flex flex-wrap items-center gap-x-[18px] gap-y-1 text-[13.5px]">
            <StatusDot tom={tomStatusGrupo(grupo.status)}>{grupo.status}</StatusDot>
            {grupo.data_termino && (
              <span className="text-muted">Encerrado em {formatDate(grupo.data_termino)}</span>
            )}
            {ativo && (
              <StatusDot tom={s.tom}>
                {[s.label, ...saude.flags.map(minusculaInicial)].join(" · ")}
              </StatusDot>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/grupos/${grupo.id}?editar=1`} prefetch={false} className="btn-secondary">
            Editar
          </Link>
          <button type="button" onClick={() => setAgendando(true)} className="btn-primary">
            Agendar reunião
          </button>
          <RowMenu
            rotulo="Mais opções do grupo"
            acoes={
              ativo
                ? [
                    {
                      label: "Cancelar grupo",
                      destrutiva: true,
                      onSelect: () => setCancelando(true),
                    },
                  ]
                : [
                    {
                      label: "Reativar grupo",
                      onSelect: () => startTransition(() => reativarGrupo(grupo.id)),
                    },
                  ]
            }
          />
        </div>
      </div>

      {cancelando && (
        <ConfirmDialog
          titulo="Cancelar grupo"
          texto="O contrato será marcado como encerrado. Se houver cláusula de cancelamento a cobrar, registre o pagamento manualmente (ou via Asaas) na aba Pagamentos do grupo."
          botao="Confirmar cancelamento"
          executando={isPending}
          onCancelar={() => setCancelando(false)}
          onConfirmar={() =>
            startTransition(async () => {
              await cancelarGrupo(grupo.id, dataCancelamento);
              setCancelando(false);
            })
          }
        >
          <label className="mt-4 block">
            <span className="rotulo mb-1.5">Data do cancelamento</span>
            <input
              type="date"
              value={dataCancelamento}
              onChange={(e) => setDataCancelamento(e.target.value)}
              className="campo"
            />
          </label>
        </ConfirmDialog>
      )}

      {agendando && (
        <AgendarReuniaoModal
          dataInicial={hoje}
          horaInicial=""
          responsavelInicial=""
          grupoInicial={grupo.id}
          hoje={hoje}
          grupos={[{ id: grupo.id, nome: displayGroupName(grupo.nome) }]}
          responsaveis={responsaveis}
          pabloId={pabloId}
          reunioesPorData={{}}
          onClose={() => setAgendando(false)}
        />
      )}
    </div>
  );
}
