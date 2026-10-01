// Central de Avisos: cada tipo vira uma lista separada, e cada item leva
// direto à ação. Tudo é calculado na hora a partir das tabelas (nada é
// gravado). O contador do menu soma todos os tipos.

export type MentoradoContato = { nome: string; telefone: string | null };

export type AvisoReuniaoHoje = {
  reuniaoId: string;
  grupoId: string;
  grupoNome: string;
  hora: string | null;
};

export type AvisoReuniao = { grupoId: string; grupoNome: string; diasSemReuniao: number | null };

export type AvisoPagamento = {
  pagamentoId: string;
  grupoId: string;
  grupoNome: string;
  valor: number;
  vencimento: string;
  mentorados: MentoradoContato[];
};

export type AvisoResultados = { grupoId: string; grupoNome: string; mes: string };

export type AvisoOnboarding = { grupoId: string; grupoNome: string };

export type AvisoProcessos = { grupoId: string; grupoNome: string; pendentes: number };

export type Avisos = {
  reuniaoHoje: AvisoReuniaoHoje[];
  reuniao: AvisoReuniao[];
  pagamento: AvisoPagamento[];
  resultados: AvisoResultados[];
  onboarding: AvisoOnboarding[];
  processos: AvisoProcessos[];
};

export const AVISOS_VAZIOS: Avisos = {
  reuniaoHoje: [],
  reuniao: [],
  pagamento: [],
  resultados: [],
  onboarding: [],
  processos: [],
};

export function totalAvisos(a: Avisos): number {
  return (
    a.reuniaoHoje.length +
    a.reuniao.length +
    a.pagamento.length +
    a.resultados.length +
    a.onboarding.length +
    a.processos.length
  );
}

// "YYYY-MM" do mês anterior ao de `hojeISO` (calendário).
export function mesAnteriorISO(hojeISO: string): string {
  const [ano, mes] = hojeISO.split("-").map(Number);
  const d = new Date(ano, mes - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
