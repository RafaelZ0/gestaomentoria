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
