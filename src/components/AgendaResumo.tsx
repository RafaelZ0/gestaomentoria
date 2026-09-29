import Link from "next/link";
import { displayGroupName, formatDate } from "@/lib/format";
import { DIAS_SEM_SINAL_DE_VIDA, type GrupoParaAgendar } from "@/lib/agendaStatus";

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
    <div className="flex w-full max-w-[240px] flex-col gap-6">
      <section className="flex flex-col">
        <h3 className="px-2 pb-1.5 text-xs font-medium text-subtle">Próximas reuniões</h3>
        {proximas.length === 0 ? (
          <p className="px-2 text-[13px] text-muted">Nenhuma.</p>
        ) : (
          proximas.slice(0, 5).map((r) => (
            <Link
              key={r.id}
              href={`/grupos/${r.grupoId}/reunioes`}
              prefetch={false}
              className="flex items-baseline justify-between gap-2 rounded-lg px-2 py-1.5 text-[13.5px] hover:bg-hover"
            >
              <span className="truncate text-text-2">{displayGroupName(r.grupoNome)}</span>
              <span className="shrink-0 text-[12.5px] tabular-nums text-subtle">
                {formatDate(r.data).slice(0, 5)}
                {r.hora ? ` ${r.hora.slice(0, 5)}` : ""}
              </span>
            </Link>
          ))
        )}
      </section>

      <section className="flex flex-col">
        <h3 className="px-2 pb-1.5 text-xs font-medium text-subtle">Quem ainda precisa agendar</h3>
        {paraAgendar.length === 0 ? (
          <p className="px-2 text-[13px] text-muted">Todo mundo em dia.</p>
        ) : (
          paraAgendar.slice(0, 5).map((g) => {
            const atrasado = g.diasSemReuniao === null || g.diasSemReuniao > DIAS_SEM_SINAL_DE_VIDA;
            return (
              <Link
                key={g.id}
                href={`/grupos/${g.id}/reunioes`}
                prefetch={false}
                className="flex items-baseline justify-between gap-2 rounded-lg px-2 py-1.5 text-[13.5px] hover:bg-hover"
              >
                <span className="truncate text-text-2">{displayGroupName(g.nome)}</span>
                <span
                  className={`shrink-0 text-[12.5px] tabular-nums ${atrasado ? "text-warn" : "text-subtle"}`}
                >
                  {g.diasSemReuniao === null ? "nunca" : `${g.diasSemReuniao}d`}
                </span>
              </Link>
            );
          })
        )}
      </section>
    </div>
  );
}
