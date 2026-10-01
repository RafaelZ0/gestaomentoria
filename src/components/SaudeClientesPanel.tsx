"use client";

import Link from "next/link";
import { displayGroupName } from "@/lib/format";
import { StatusDot, type Tom } from "@/components/ui/StatusDot";
import type { StatusSaude } from "@/lib/saude";

const STATUS: Record<StatusSaude, { label: string; tom: Tom }> = {
  ok: { label: "Saudável", tom: "ok" },
  warn: { label: "Atenção", tom: "warn" },
  alert: { label: "Crítico", tom: "danger" },
};

export function SaudeClientesPanel({
  grupos,
}: {
  grupos: { id: string; nome: string; status: StatusSaude; flags: string[] }[];
}) {
  if (grupos.length === 0) {
    return <p className="py-6 text-sm text-muted">Nenhum grupo ativo.</p>;
  }

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-[1.4fr_1fr_2.4fr] gap-4 border-b border-line px-3 pb-2.5 pt-3 text-[13px] text-muted">
        <span>Grupo</span>
        <span>Status</span>
        <span>Sinais</span>
      </div>
      {grupos.map((g) => (
        <Link
          key={g.id}
          href={`/grupos/${g.id}`}
          prefetch={false}
          className="grid grid-cols-[1.4fr_1fr_2.4fr] items-center gap-4 border-b border-line-soft px-3 py-3 text-[14.5px] transition-colors last:border-b-0 hover:bg-hover"
        >
          <span className="truncate text-text">{displayGroupName(g.nome)}</span>
          <StatusDot tom={STATUS[g.status].tom} className="text-[13.5px]">
            {STATUS[g.status].label}
          </StatusDot>
          <span className="text-[13.5px] text-muted">
            {g.flags.length > 0 ? g.flags.join(" · ") : "Nenhum sinal de alerta"}
          </span>
        </Link>
      ))}
    </div>
  );
}
