// Grade fixa de horários de reunião do Pablo (agenda da clínica dele,
// conforme PDF "horários Pablo" enviado em 2026-08-18). Segunda e sábado
// são quinzenais (alternam com "Gravação"/sem entrega da mentoria),
// sincronizados pela mesma referência de semana: 22/08/2026 (sábado) é
// uma "semana de reunião".
const REFERENCIA_SEMANA_DE_REUNIAO = new Date(2026, 7, 22);

function ehSemanaDeReuniao(data: Date): boolean {
  const diffDias = Math.round(
    (data.getTime() - REFERENCIA_SEMANA_DE_REUNIAO.getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const diffSemanas = Math.floor(diffDias / 7);
  return ((diffSemanas % 2) + 2) % 2 === 0;
}

export function horariosPablo(dataISO: string): string[] {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  const diaSemana = data.getDay(); // 0=domingo … 6=sábado
  const semanaDeReuniao = ehSemanaDeReuniao(data);

  switch (diaSemana) {
    case 1: // segunda — Entrega da mentoria (quinzenal)
      return semanaDeReuniao ? ["19:00"] : [];
    case 2: // terça
      return ["12:20", "19:00"];
    case 3: // quarta
      return ["12:20", "19:00"];
    case 4: // quinta
      return ["13:00", "15:30", "17:00", "18:30"];
    case 5: // sexta
      return ["12:20", "17:30", "19:00"];
    case 6: // sábado (quinzenal)
      return semanaDeReuniao ? ["13:15", "14:30"] : [];
    default: // domingo
      return [];
  }
}
