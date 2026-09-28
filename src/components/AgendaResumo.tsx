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
        <h3 className="px-1 text-xs font-semibold text-text-2">
          Próximas reuniões
        </h3>
        {proximas.length === 0 ? (
          <p className="mt-1 px-1 text-xs text-text-2">Nenhuma.</p>
        ) : (
          <ul className="mt-1.5 space-y-1">
            {proximas.slice(0, 5).map((r) => (
              <li key={r.id}>
                <Link
                  href={`/grupos/${r.grupoId}/reunioes`}
                  prefetch={false}
                  className="block rounded-lg border border-line bg-surface px-2 py-1.5 text-xs hover:bg-hover"
                >
                  <span className="block truncate font-medium text-text">
                    {r.grupoNome}
                  </span>
                  <span className="text-text-2">
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
        <h3 className="px-1 text-xs font-semibold text-text-2">
          Quem ainda precisa agendar
        </h3>
        {paraAgendar.length === 0 ? (
          <p className="mt-1 px-1 text-xs text-text-2">
            Todo mundo em dia.
          </p>
        ) : (
          <ul className="mt-1.5 space-y-1">
            {paraAgendar.slice(0, 5).map((g) => (
              <li key={g.id}>
                <Link
                  href={`/grupos/${g.id}/reunioes`}
                  prefetch={false}
                  className="flex items-center justify-between gap-2 rounded-lg border border-warn/30 bg-warn/10 px-2 py-1.5 text-xs hover:bg-warn/15"
                >
                  <span className="truncate font-medium text-text">
                    {g.nome}
                  </span>
                  <span className="shrink-0 text-warn">
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
