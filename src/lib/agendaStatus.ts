export interface ReuniaoParaStatus {
  id: string;
  grupo_id: string;
  data: string;
  compareceu: boolean;
}

export interface GrupoParaAgendar {
  id: string;
  nome: string;
  diasSemReuniao: number | null;
}

function diasEntre(dataAntiga: string, hoje: string): number {
  return Math.floor(
    (new Date(hoje + "T00:00:00").getTime() -
      new Date(dataAntiga + "T00:00:00").getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

// Uma reunião "conta" pra todo grupo com participante nela, não só pro
// grupo dono — reunião conjunta vale sinal de vida pra quem participou.
export function calcularGruposPorReuniao(
  reunioes: { id: string; grupo_id: string }[],
  participantes: { reuniao_id: string; mentorados: { grupo_id: string } | null }[]
): Map<string, Set<string>> {
  const gruposPorReuniao = new Map<string, Set<string>>();
  for (const r of reunioes) {
    gruposPorReuniao.set(r.id, new Set([r.grupo_id]));
  }
  for (const p of participantes) {
    const grupoId = p.mentorados?.grupo_id;
    if (!grupoId) continue;
    gruposPorReuniao.get(p.reuniao_id)?.add(grupoId);
  }
  return gruposPorReuniao;
}

export const DIAS_SEM_SINAL_DE_VIDA = 30;

export interface GrupoSemSinal {
  id: string;
  nome: string;
  dias: number | null;
}

// Regra única de "última reunião" (Visão geral do grupo, saúde do cliente,
// lista de grupos, "sem sinal de vida" e barra lateral): a reunião mais
// recente até hoje — reuniões só agendadas não contam —, própria ou em que
// um mentorado do grupo participou como convidado.
export function calcularUltimaReuniaoPorGrupo(
  reunioes: { id: string; grupo_id: string; data: string }[],
  gruposPorReuniao: Map<string, Set<string>>,
  hojeISO: string = new Date().toISOString().slice(0, 10)
): Map<string, string> {
  const ultima = new Map<string, string>();
  for (const r of reunioes) {
    if (r.data > hojeISO) continue;
    const gruposEnvolvidos = gruposPorReuniao.get(r.id) ?? new Set([r.grupo_id]);
    for (const gid of gruposEnvolvidos) {
      const atual = ultima.get(gid);
      if (!atual || r.data > atual) ultima.set(gid, r.data);
    }
  }
  return ultima;
}

export function diasDesde(dataISO: string, hojeISO: string): number {
  return diasEntre(dataISO, hojeISO);
}

// "Sem sinal de vida": grupos ativos cuja última reunião (regra acima) foi
// há mais de 30 dias, ou que nunca tiveram reunião. Do maior atraso pro
// menor (nunca = primeiro). Usado nas métricas de Grupos de gestão e na
// seção da barra lateral.
export function calcularSemSinalDeVida(
  gruposAtivos: { id: string; nome: string }[],
  reunioes: { id: string; grupo_id: string; data: string }[],
  gruposPorReuniao: Map<string, Set<string>>,
  hoje: Date = new Date()
): GrupoSemSinal[] {
  const hojeISO = hoje.toISOString().slice(0, 10);
  const ultimaReuniaoPorGrupo = calcularUltimaReuniaoPorGrupo(
    reunioes,
    gruposPorReuniao,
    hojeISO
  );

  return gruposAtivos
    .map((g) => {
      const ultima = ultimaReuniaoPorGrupo.get(g.id);
      const dias = ultima ? diasDesde(ultima, hojeISO) : null;
      return { id: g.id, nome: g.nome, dias };
    })
    .filter((g) => g.dias === null || g.dias > DIAS_SEM_SINAL_DE_VIDA)
    .sort((a, b) => (b.dias ?? Infinity) - (a.dias ?? Infinity));
}

// Grupos ativos sem nenhuma reunião futura agendada e cuja última reunião
// (se existir) foi há mais de `diasLimite` dias — mesma regra usada no
// sino de notificações "hora de agendar a próxima reunião".
export function calcularGruposParaAgendar(
  gruposAtivos: { id: string; nome: string }[],
  reunioes: ReuniaoParaStatus[],
  gruposPorReuniao: Map<string, Set<string>>,
  hoje: string,
  diasLimite: number
): GrupoParaAgendar[] {
  const porGrupo = new Map<string, { ultima: string | null; temFutura: boolean }>();
  for (const g of gruposAtivos) {
    porGrupo.set(g.id, { ultima: null, temFutura: false });
  }

  for (const r of reunioes) {
    const gruposEnvolvidos = gruposPorReuniao.get(r.id) ?? new Set([r.grupo_id]);
    for (const gid of gruposEnvolvidos) {
      const info = porGrupo.get(gid);
      if (!info) continue;
      if (r.data > hoje && r.compareceu) info.temFutura = true;
      if (r.data <= hoje && (!info.ultima || r.data > info.ultima)) {
        info.ultima = r.data;
      }
    }
  }

  return gruposAtivos
    .filter((g) => {
      const info = porGrupo.get(g.id)!;
      if (info.temFutura) return false;
      if (!info.ultima) return true;
      return diasEntre(info.ultima, hoje) > diasLimite;
    })
    .map((g) => {
      const ultima = porGrupo.get(g.id)!.ultima;
      return {
        id: g.id,
        nome: g.nome,
        diasSemReuniao: ultima ? diasEntre(ultima, hoje) : null,
      };
    });
}
