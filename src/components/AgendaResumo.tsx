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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section>
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Próximas reuniões
        </h2>
        {proximas.length === 0 ? (
          <p className="mt-2 text-sm text-text-secondary">
            Nenhuma reunião agendada.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {proximas.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/grupos/${r.grupoId}/reunioes`}
                  prefetch={false}
                  className="flex items-center justify-between rounded-lg border border-border bg-bg-surface px-4 py-3 text-sm hover:bg-bg-surface-hover"
                >
                  <span>
                    <span className="font-medium text-text-primary">
                      {r.grupoNome}
                    </span>
                    <span className="text-text-secondary">
                      {" "}
                      — {formatDate(r.data)}
                      {r.hora ? ` às ${r.hora.slice(0, 5)}` : ""}
                      {r.responsavelNome ? ` (${r.responsavelNome})` : ""}
                    </span>
                  </span>
                  {r.linkReuniao && (
                    <span className="text-xs text-accent">Link</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Quem ainda precisa agendar
        </h2>
        {paraAgendar.length === 0 ? (
          <p className="mt-2 text-sm text-text-secondary">
            Todo mundo com reunião futura marcada.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {paraAgendar.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/grupos/${g.id}/reunioes`}
                  prefetch={false}
                  className="flex items-center justify-between rounded-lg border border-status-warn-text/30 bg-status-warn-bg px-4 py-3 text-sm hover:bg-status-warn-bg/70"
                >
                  <span className="font-medium text-text-primary">
                    {g.nome}
                  </span>
                  <span className="text-xs text-status-warn-text">
                    {g.diasSemReuniao === null
                      ? "nunca teve reunião"
                      : `há ${g.diasSemReuniao} dias`}
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
