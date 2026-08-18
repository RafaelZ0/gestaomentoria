// Grade fixa de horários de reunião do Pablo (agenda da clínica dele,
// conforme PDF "horários Pablo" enviado em 2026-08-18, com o ajuste de
// segunda-feira pedido em seguida). Só o sábado é quinzenal (alterna com
// "Gravação"/sem entrega da mentoria), referência: 22/08/2026 (sábado) é
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
    case 1: // segunda — 3 horários toda semana
      return ["18:00", "19:00", "20:00"];
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

export interface BlocoClinica {
  label: string;
  inicio: string;
  fim: string;
}

// Compromissos da clínica (não são reunião, só contexto visual — vêm do
// mesmo PDF). Manhã e tarde de cada dia, no nível de detalhe que o PDF dá
// (um rótulo por período; não inventa sub-horários que o PDF não define).
export function blocosClinicaPablo(dataISO: string): BlocoClinica[] {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  const diaSemana = data.getDay();
  const semanaDeReuniao = ehSemanaDeReuniao(data);

  switch (diaSemana) {
    case 1: // segunda
      return [
        { label: "Coringa", inicio: "08:00", fim: "12:00" },
        { label: "Avaliação", inicio: "13:30", fim: "18:00" },
      ];
    case 2: // terça
      return [
        { label: "Cirurgia", inicio: "08:00", fim: "12:00" },
        { label: "Cirurgia", inicio: "13:30", fim: "19:00" },
      ];
    case 3: // quarta
      return [
        { label: "Consulta de Alta", inicio: "08:00", fim: "12:00" },
        { label: "Avaliação", inicio: "13:30", fim: "19:00" },
      ];
    case 4: // quinta — tarde/noite são só os horários de reunião (ver horariosPablo)
      return [{ label: "Curso de Implante", inicio: "08:00", fim: "12:00" }];
    case 5: // sexta
      return [
        { label: "Reunião Equipe Clínica / Coringa", inicio: "08:00", fim: "12:00" },
        { label: "Cirurgia curso / Coringa", inicio: "13:30", fim: "17:30" },
      ];
    case 6: // sábado
      return semanaDeReuniao
        ? [{ label: "Avaliação", inicio: "08:00", fim: "12:00" }]
        : [
            { label: "Avaliação", inicio: "08:00", fim: "12:00" },
            { label: "Gravação", inicio: "13:15", fim: "15:30" },
          ];
    default:
      return [];
  }
}
