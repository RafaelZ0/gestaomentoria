import { pct, perdaDoPiorEstagio, type Funil } from "@/lib/onboarding";

export function FunilOnboarding({
  funil,
  titulo = "O funil da clínica",
  subtitulo = "Calculado com os números que acabamos de preencher.",
}: {
  funil: Funil;
  titulo?: string;
  subtitulo?: string;
}) {
  const base = funil.c || Math.max(funil.a ?? 0, funil.r ?? 0, funil.f ?? 0) || 1;
  const linhas: [string, number | null][] = [
    ["Contatos", funil.c],
    ["Agendados", funil.a],
    ["Vieram", funil.r],
    ["Fecharam", funil.f],
  ];
  const perda = perdaDoPiorEstagio(funil);

  return (
    <div>
      <h3 className="font-display text-xl font-semibold text-text-primary">{titulo}</h3>
      <p className="mt-1 text-sm text-text-secondary">{subtitulo}</p>

      <div className="mt-5 space-y-1">
        {linhas.map(([rotulo, valor], i) => {
          const largura = valor == null ? 0 : Math.max(6, Math.min(100, (valor / base) * 100));
          const taxa = i < 3 ? funil.rates[i] : null;
          const ehPior = taxa && funil.worst?.nome === taxa.nome;
          return (
            <div key={rotulo}>
              <div className="grid grid-cols-[96px_1fr_64px] items-center gap-3 sm:grid-cols-[120px_1fr_72px]">
                <span className="text-base text-text-primary">{rotulo}</span>
                <div className="h-9 overflow-hidden rounded-lg border border-border bg-bg-base">
                  <div
                    className="h-full rounded-l-md bg-accent transition-[width] duration-500"
                    style={{ width: `${largura}%` }}
                  />
                </div>
                <span className="text-right font-display text-lg font-semibold tabular-nums text-text-primary">
                  {valor ?? "—"}
                </span>
              </div>
              {taxa && (
                <div className="grid grid-cols-[96px_1fr] gap-3 py-1 sm:grid-cols-[120px_1fr]">
                  <span />
                  <span className={`text-sm ${ehPior ? "text-status-warn-text" : "text-text-secondary"}`}>
                    ↓ {taxa.nome}:{" "}
                    <b className={ehPior ? "text-status-warn-text" : "text-text-primary"}>{pct(taxa.v)}</b>
                    {ehPior && " · maior perda"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {funil.worst ? (
        <div className="mt-5 rounded-xl border border-status-warn-text/30 bg-status-warn-bg px-5 py-4 text-base text-text-primary">
          A maior perda está no <b>{funil.worst.nome.toLowerCase()}</b>: de cada 10 pessoas nessa
          etapa, cerca de {Math.round((1 - (funil.worst.v ?? 0)) * 10)} não avançam
          {perda != null ? ` (${perda} por mês)` : ""}.
        </div>
      ) : (
        <p className="mt-4 text-sm text-text-secondary">
          Preencha pelo menos três números do funil para ver onde o paciente mais se perde.
        </p>
      )}

      {funil.issues.length > 0 && (
        <p className="mt-3 text-sm text-status-alert-text">
          Vale conferir: {funil.issues.join("; ")}.
        </p>
      )}
    </div>
  );
}
