"use client";

import Link from "next/link";
import { plural } from "@/lib/format";

export type NotificacaoAgendar = {
  id: string;
  nome: string;
  diasSemReuniao: number | null;
};
export type NotificacaoHoje = {
  reuniaoId: string;
  grupoId: string;
  grupoNome: string;
  hora: string | null;
};

// Conteúdo do item "Avisos" da barra lateral (antigo sino): reunião de hoje
// (lembrete) e grupos na hora de agendar a próxima reunião.
export function AvisosPainel({
  notifAgendar,
  notifHoje,
  onNavegar,
}: {
  notifAgendar: NotificacaoAgendar[];
  notifHoje: NotificacaoHoje[];
  onNavegar: () => void;
}) {
  if (notifAgendar.length + notifHoje.length === 0) {
    return <p className="px-3 py-4 text-sm text-muted">Nenhum aviso por enquanto.</p>;
  }

  return (
    <div className="space-y-3">
      {notifHoje.length > 0 && (
        <div>
          <p className="px-3 pb-1 text-[13px] text-subtle">Reunião hoje</p>
          {notifHoje.map((n) => (
            <Link
              key={n.reuniaoId}
              href={`/grupos/${n.grupoId}/reunioes`}
              prefetch={false}
              onClick={onNavegar}
              className="block rounded-lg px-3 py-2 text-sm hover:bg-hover"
            >
              <span className="font-medium text-text">{n.grupoNome}</span>
              <span className="text-text-2">
                {" "}
                · reunião hoje{n.hora ? ` às ${n.hora.slice(0, 5)}` : ""}, não esqueça de
                mandar o lembrete
              </span>
            </Link>
          ))}
        </div>
      )}
      {notifAgendar.length > 0 && (
        <div>
          <p className="px-3 pb-1 text-[13px] text-subtle">Hora de agendar a próxima reunião</p>
          {notifAgendar.map((n) => (
            <Link
              key={n.id}
              href={`/grupos/${n.id}/reunioes`}
              prefetch={false}
              onClick={onNavegar}
              className="flex items-baseline justify-between gap-3 rounded-lg px-3 py-2 text-sm hover:bg-hover"
            >
              <span className="font-medium text-text">{n.nome}</span>
              <span className="shrink-0 text-[13px] text-muted">
                {n.diasSemReuniao === null
                  ? "nunca teve reunião"
                  : `última há ${plural(n.diasSemReuniao, "dia", "dias")}`}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
