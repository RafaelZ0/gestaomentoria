import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { GrupoParaAgendar } from "@/lib/agendaStatus";

export type ProximaReuniao = {
  id: string;
  grupoId: string;
  grupoNome: string;
  data: string;
  hora: string | null;
  responsavelNome: string | null;
  linkReuniao: string | null;
};

export function AgendaResumo({
  proximas,
  paraAgendar,
}: {
  proximas: ProximaReuniao[];
  paraAgendar: GrupoParaAgendar[];
}) {
  return (
    <div className="w-full max-w-[260px] space-y-4">
      <section>
        <h3 className="px-1 text-xs font-semibold text-text-secondary">
          Próximas reuniões
        </h3>
        {proximas.length === 0 ? (
          <p className="mt-1 px-1 text-xs text-text-secondary">Nenhuma.</p>
        ) : (
          <ul className="mt-1.5 space-y-1">
            {proximas.slice(0, 5).map((r) => (
              <li key={r.id}>
                <Link
                  href={`/grupos/${r.grupoId}/reunioes`}
                  prefetch={false}
                  className="block rounded-lg border border-border bg-bg-surface px-2 py-1.5 text-xs hover:bg-bg-surface-hover"
                >
                  <span className="block truncate font-medium text-text-primary">
                    {r.grupoNome}
                  </span>
                  <span className="text-text-secondary">
                    {formatDate(r.data)}
                    {r.hora ? ` ${r.hora.slice(0, 5)}` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="px-1 text-xs font-semibold text-text-secondary">
          Quem ainda precisa agendar
        </h3>
        {paraAgendar.length === 0 ? (
          <p className="mt-1 px-1 text-xs text-text-secondary">
            Todo mundo em dia.
          </p>
        ) : (
          <ul className="mt-1.5 space-y-1">
            {paraAgendar.slice(0, 5).map((g) => (
              <li key={g.id}>
                <Link
                  href={`/grupos/${g.id}/reunioes`}
                  prefetch={false}
                  className="flex items-center justify-between gap-2 rounded-lg border border-status-warn-text/30 bg-status-warn-bg px-2 py-1.5 text-xs hover:bg-status-warn-bg/70"
                >
                  <span className="truncate font-medium text-text-primary">
                    {g.nome}
                  </span>
                  <span className="shrink-0 text-status-warn-text">
                    {g.diasSemReuniao === null
                      ? "nunca"
                      : `${g.diasSemReuniao}d`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
