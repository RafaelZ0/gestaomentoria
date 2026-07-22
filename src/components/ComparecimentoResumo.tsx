type MentoradoResumo = { id: string; nome: string };

export function ComparecimentoResumo({
  totalAgendadas,
  faltas,
  mentorados,
}: {
  totalAgendadas: number;
  faltas: number;
  mentorados: MentoradoResumo[];
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

      {mentorados.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-xs text-text-secondary">
            Por mentorado (as reuniões são do grupo todo, então a falta vale
            para todos os mentorados atuais do grupo)
          </p>
          <ul className="space-y-1">
            {mentorados.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-text-primary">{m.nome}</span>
                <span className="text-text-secondary">
                  {faltas} falta{faltas === 1 ? "" : "s"} · {comparecimentoPct}%
                  de comparecimento
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
