type MentoradoResumo = { id: string; nome: string; faltas: number };

export function ComparecimentoResumo({
  totalAgendadas,
  faltasGrupoTodo,
  mentorados,
}: {
  totalAgendadas: number;
  faltasGrupoTodo: number;
  mentorados: MentoradoResumo[];
}) {
  if (totalAgendadas === 0) return null;

  const comparecimentoMedio =
    mentorados.length > 0
      ? Math.round(
          (mentorados.reduce(
            (acc, m) => acc + (totalAgendadas - m.faltas),
            0
          ) /
            (mentorados.length * totalAgendadas)) *
            100
        )
      : Math.round(((totalAgendadas - faltasGrupoTodo) / totalAgendadas) * 100);

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
          <p className="text-sm text-text-secondary">Reuniões sem ninguém</p>
          <p
            className={`mt-1 font-display text-2xl font-semibold tabular-nums ${
              faltasGrupoTodo > 0 ? "text-status-alert-text" : "text-text-primary"
            }`}
          >
            {faltasGrupoTodo}
          </p>
        </div>
        <div>
          <p className="text-sm text-text-secondary">Comparecimento médio</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-text-primary">
            {comparecimentoMedio}%
          </p>
        </div>
      </div>

      {mentorados.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-xs text-text-secondary">
            Por mentorado (conta falta quando o grupo todo não compareceu, ou
            quando a reunião aconteceu mas a pessoa não foi marcada como
            participante)
          </p>
          <ul className="space-y-1">
            {mentorados.map((m) => {
              const pct = Math.round(
                ((totalAgendadas - m.faltas) / totalAgendadas) * 100
              );
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-text-primary">{m.nome}</span>
                  <span className="text-text-secondary">
                    {m.faltas} falta{m.faltas === 1 ? "" : "s"} · {pct}% de
                    comparecimento
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
