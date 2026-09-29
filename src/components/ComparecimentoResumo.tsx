import { Metric } from "@/components/ui/Metric";

export function ComparecimentoResumo({
  totalAgendadas,
  faltas,
}: {
  totalAgendadas: number;
  faltas: number;
}) {
  if (totalAgendadas === 0) return null;

  const comparecimentoPct = Math.round(((totalAgendadas - faltas) / totalAgendadas) * 100);

  return (
    <div className="grid grid-cols-3 gap-6 border-b border-line pb-6">
      <Metric rotulo="Reuniões agendadas">{totalAgendadas}</Metric>
      <Metric rotulo="Faltas" tom={faltas > 0 ? "danger" : undefined}>
        {faltas}
      </Metric>
      <Metric rotulo="Comparecimento">{comparecimentoPct}%</Metric>
    </div>
  );
}
