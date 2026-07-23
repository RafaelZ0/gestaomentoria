export function ComparecimentoResumo({
  totalAgendadas,
  faltas,
  reunioesExternas = 0,
}: {
  totalAgendadas: number;
  faltas: number;
  reunioesExternas?: number;
}) {
  if (totalAgendadas === 0) return null;

  const comparecimentoPct = Math.round(
    ((totalAgendadas - faltas) / totalAgendadas) * 100
  );

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-text-secondary">Reuniões agendadas</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-text-primary">
            {totalAgendadas}
          </p>
        </div>
        <div>
          <p className="text-sm text-text-secondary">Faltas</p>
          <p
            className={`mt-1 font-display text-2xl font-semibold tabular-nums ${
              faltas > 0 ? "text-status-alert-text" : "text-text-primary"
            }`}
          >
            {faltas}
          </p>
        </div>
        <div>
          <p className="text-sm text-text-secondary">Comparecimento</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-text-primary">
            {comparecimentoPct}%
          </p>
        </div>
      </div>
      {reunioesExternas > 0 && (
        <p className="mt-3 border-t border-border pt-3 text-xs text-text-secondary">
          + {reunioesExternas} reunião{reunioesExternas === 1 ? "" : "ões"} listada
          {reunioesExternas === 1 ? "" : "s"} abaixo em que alguém deste grupo
          participou como convidado em outro grupo — não conta nesses números.
        </p>
      )}
    </div>
  );
}
