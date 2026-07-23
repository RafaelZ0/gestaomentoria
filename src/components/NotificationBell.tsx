"use client";

import { useState } from "react";
import Link from "next/link";

export type NotificacaoAgendar = { id: string; nome: string };
export type NotificacaoHoje = {
  reuniaoId: string;
  grupoId: string;
  grupoNome: string;
  hora: string | null;
};

export function NotificationBell({
  notifAgendar,
  notifHoje,
}: {
  notifAgendar: NotificacaoAgendar[];
  notifHoje: NotificacaoHoje[];
}) {
  const [aberto, setAberto] = useState(false);
  const total = notifAgendar.length + notifHoje.length;

  if (total === 0) {
    return (
      <button
        type="button"
        disabled
        aria-label="Sem notificações"
        className="relative rounded-lg p-2 text-text-secondary opacity-50"
      >
        🔔
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-label={`${total} notificações`}
        className="relative rounded-lg p-2 text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary"
      >
        🔔
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-alert-text px-1 text-[10px] font-semibold text-white">
          {total}
        </span>
      </button>

      {aberto && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setAberto(false)}
          />
          <div className="absolute left-0 z-50 mt-2 w-80 rounded-xl border border-border bg-bg-surface p-2 shadow-xl">
            {notifHoje.length > 0 && (
              <div className="mb-2">
                <p className="px-2 py-1 text-xs font-medium text-text-secondary">
                  Reunião hoje
                </p>
                {notifHoje.map((n) => (
                  <Link
                    key={n.reuniaoId}
                    href={`/grupos/${n.grupoId}/reunioes`}
                    onClick={() => setAberto(false)}
                    className="block rounded-lg px-2 py-2 text-sm hover:bg-bg-surface-hover"
                  >
                    <span className="font-medium text-text-primary">
                      {n.grupoNome}
                    </span>
                    <span className="text-text-secondary">
                      {" "}
                      — reunião hoje{n.hora ? ` às ${n.hora.slice(0, 5)}` : ""},
                      não esqueça de mandar o lembrete
                    </span>
                  </Link>
                ))}
              </div>
            )}
            {notifAgendar.length > 0 && (
              <div>
                <p className="px-2 py-1 text-xs font-medium text-text-secondary">
                  Hora de agendar a próxima reunião
                </p>
                {notifAgendar.map((n) => (
                  <Link
                    key={n.id}
                    href={`/grupos/${n.id}/reunioes`}
                    onClick={() => setAberto(false)}
                    className="block rounded-lg px-2 py-2 text-sm hover:bg-bg-surface-hover"
                  >
                    <span className="font-medium text-text-primary">
                      {n.nome}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
