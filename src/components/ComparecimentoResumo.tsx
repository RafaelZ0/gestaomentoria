export function ComparecimentoResumo({
  totalAgendadas,
  faltas,
}: {
  totalAgendadas: number;
  faltas: number;
}) {
  if (totalAgendadas === 0) return null;

  const comparecimentoPct = Math.round(
    ((totalAgendadas - faltas) / totalAgendadas) * 100
  );

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-text-2">Reuniões agendadas</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-text">
            {totalAgendadas}
          </p>
        </div>
        <div>
          <p className="text-sm text-text-2">Faltas</p>
          <p
            className={`mt-1 font-display text-2xl font-semibold tabular-nums ${
              faltas > 0 ? "text-danger" : "text-text"
            }`}
          >
            {faltas}
          </p>
        </div>
        <div>
          <p className="text-sm text-text-2">Comparecimento</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-text">
            {comparecimentoPct}%
          </p>
        </div>
      </div>
    </div>
  );
}
