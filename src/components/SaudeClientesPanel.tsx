"use client";

import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import type { StatusSaude } from "@/lib/saude";

const STATUS_LABEL: Record<StatusSaude, string> = {
  ok: "Saudável",
  warn: "Atenção",
  alert: "Crítico",
};

const STATUS_VARIANT: Record<StatusSaude, "ok" | "warn" | "alert"> = {
  ok: "ok",
  warn: "warn",
  alert: "alert",
};

export function SaudeClientesPanel({
  grupos,
}: {
  grupos: { id: string; nome: string; status: StatusSaude; flags: string[] }[];
}) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-text-2">
            <th className="px-4 py-3 font-medium">Grupo</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Sinais</th>
          </tr>
        </thead>
        <tbody>
          {grupos.map((g) => (
            <tr
              key={g.id}
              onClick={() => router.push(`/grupos/${g.id}`)}
              className="cursor-pointer border-b border-line last:border-0 hover:bg-hover"
            >
              <td className="px-4 py-3 font-medium text-text">{g.nome}</td>
              <td className="px-4 py-3">
                <StatusBadge
                  label={STATUS_LABEL[g.status]}
                  variant={STATUS_VARIANT[g.status]}
                />
              </td>
              <td className="px-4 py-3 text-text-2">
                {g.flags.length > 0 ? g.flags.join(" · ") : "Nenhum sinal de alerta"}
              </td>
            </tr>
          ))}
          {grupos.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-text-2">
                Nenhum grupo ativo.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
