import { blocosClinicaPablo, horariosPablo } from "@/lib/disponibilidadePablo";

// Regras de conflito da agenda (usadas no modal, pra avisar enquanto edita,
// e de novo na server action, que é quem decide):
// - reunião x reunião do MESMO responsável no mesmo intervalo = conflito;
// - reunião do Pablo em cima de compromisso da clínica = conflito, exceto
//   quando começa num horário oficial de reunião do PDF (ex.: 12:20, que cai
//   dentro do almoço de propósito);
// - reunião só do Rafael em cima de compromisso = não é conflito.

export function minutosDoHorario(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function horarioDosMinutos(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export type ReuniaoParaConflito = {
  id: string;
  hora: string; // HH:MM
  duracaoMin: number;
  responsavelId: string | null;
  grupoNome: string;
};

export type Conflito = {
  tipo: "reuniao" | "compromisso";
  descricao: string;
  inicio: string;
  fim: string;
};

function sobrepoe(aIni: number, aFim: number, bIni: number, bFim: number) {
  return aIni < bFim && bIni < aFim;
}

export function calcularConflitos({
  data,
  hora,
  duracaoMin,
  responsavelId,
  pabloId,
  reunioesDoDia,
  ignorarReuniaoId,
}: {
  data: string;
  hora: string;
  duracaoMin: number;
  responsavelId: string;
  pabloId: string | null;
  reunioesDoDia: ReuniaoParaConflito[];
  ignorarReuniaoId?: string;
}): Conflito[] {
  const inicio = minutosDoHorario(hora);
  const fim = inicio + duracaoMin;
  const conflitos: Conflito[] = [];

  for (const r of reunioesDoDia) {
    if (r.id === ignorarReuniaoId || r.responsavelId !== responsavelId) continue;
    const rIni = minutosDoHorario(r.hora);
    const rFim = rIni + r.duracaoMin;
    if (sobrepoe(inicio, fim, rIni, rFim)) {
      conflitos.push({
        tipo: "reuniao",
        descricao: `Reunião ${r.grupoNome}`,
        inicio: horarioDosMinutos(rIni),
        fim: horarioDosMinutos(rFim),
      });
    }
  }

  const ehPablo = !!pabloId && responsavelId === pabloId;
  if (ehPablo && !horariosPablo(data).includes(hora)) {
    for (const b of blocosClinicaPablo(data)) {
      if (sobrepoe(inicio, fim, minutosDoHorario(b.inicio), minutosDoHorario(b.fim))) {
        conflitos.push({
          tipo: "compromisso",
          descricao: `Clínica: ${b.label}`,
          inicio: b.inicio,
          fim: b.fim,
        });
      }
    }
  }

  return conflitos.sort((a, b) => a.inicio.localeCompare(b.inicio));
}
