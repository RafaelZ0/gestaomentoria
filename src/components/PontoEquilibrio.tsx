import { formatBRL } from "@/lib/format";
import { Metric } from "@/components/ui/Metric";

// Ponto de equilíbrio: receita recorrente (soma do valor mensal dos ativos)
// contra os custos fixos mensais, e quantos grupos no valor médio cobrado
// seriam precisos pra empatar. Tudo calculado na hora a partir do banco.
export function PontoEquilibrio({
  valoresMensaisAtivos,
  custosFixos,
}: {
  valoresMensaisAtivos: number[];
  custosFixos: number;
}) {
  const ativos = valoresMensaisAtivos.length;
  const receita = valoresMensaisAtivos.reduce((acc, v) => acc + v, 0);
  const valorMedio = ativos > 0 ? receita / ativos : 0;
  const necessarios = valorMedio > 0 ? custosFixos / valorMedio : null;
  const empatou = receita >= custosFixos;
  const progresso = necessarios ? Math.min(1, ativos / necessarios) : 0;
  const faltam = necessarios !== null ? Math.max(0, necessarios - ativos) : null;

  const fmt1 = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-[15px] font-semibold text-text">Ponto de equilíbrio</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Metric rotulo="Receita recorrente mensal">{formatBRL(receita)}</Metric>
        <Metric rotulo="Custos fixos mensais">{formatBRL(custosFixos)}</Metric>
        <Metric rotulo="Grupos pra empatar" tom={empatou ? "ok" : undefined}>
          {necessarios === null ? "—" : `~${fmt1(necessarios)}`}
          <span className="mt-1 block text-[12.5px] font-normal tracking-normal text-muted">
            no valor médio de {formatBRL(valorMedio)}
          </span>
        </Metric>
      </div>

      {necessarios !== null && (
        <div className="flex flex-col gap-2">
          <div
            className="h-2 overflow-hidden rounded-full bg-raised"
            role="progressbar"
            aria-valuenow={Math.round(progresso * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Grupos ativos em relação ao ponto de equilíbrio"
          >
            <div
              className={`h-full rounded-full ${empatou ? "bg-ok" : "bg-gold"}`}
              style={{ width: `${Math.round(progresso * 100)}%` }}
            />
          </div>
          <p className="text-[13.5px] text-text-2">
            <span className="text-text">
              {ativos} de ~{Math.ceil(necessarios)} grupos
            </span>
            {empatou ? (
              <span className="text-ok"> · receita recorrente já cobre os custos fixos</span>
            ) : (
              <span className="text-muted">
                {" "}
                · faltam ~{fmt1(faltam ?? 0)} {(faltam ?? 0) <= 1 ? "grupo" : "grupos"} (
                {formatBRL(custosFixos - receita)}/mês)
              </span>
            )}
          </p>
        </div>
      )}
      {ativos === 0 && (
        <p className="text-[13.5px] text-muted">
          Nenhum grupo ativo — sem valor médio pra calcular.
        </p>
      )}
    </section>
  );
}
