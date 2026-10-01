import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { calcularGruposParaAgendar, calcularGruposPorReuniao } from "@/lib/agendaStatus";
import { displayGroupName } from "@/lib/format";
import {
  DIAS_AVISO_RENOVACAO,
  diasAteData,
  mesAnteriorISO,
  type Avisos,
  type MentoradoContato,
} from "@/lib/avisos";

// Passado esse número de dias sem reunião e sem nenhuma reunião futura já
// agendada, avisa que está na hora de marcar a próxima — mais cedo que o
// "sem sinal de vida" (+30d), pra agir antes de virar alerta.
export const DIAS_PARA_AGENDAR = 20;

// Busca tudo o que a central de Avisos precisa (uma vez por requisição).
export const getAvisos = cache(async (): Promise<Avisos> => {
  const supabase = await createClient();
  const hoje = new Date().toISOString().slice(0, 10);
  const mesAnterior = mesAnteriorISO(hoje);

  const [
    { data: grupos },
    { data: reunioes },
    { data: participantes },
    { data: atrasados },
    { data: mentorados },
    { data: resultados },
    { data: onboardings },
    { data: processosAtivos },
    { data: entregas },
  ] = await Promise.all([
    supabase.from("grupos_gestao").select("id, nome, status, trafego_pago, data_fim_contrato"),
    supabase.from("reunioes").select("id, grupo_id, data, compareceu, hora"),
    supabase.from("reuniao_participantes").select("reuniao_id, mentorados(grupo_id)"),
    supabase
      .from("pagamentos")
      .select("id, grupo_id, data, valor")
      .eq("status", "PENDENTE")
      .lt("data", hoje)
      .order("data", { ascending: true }),
    supabase.from("mentorados").select("grupo_id, nome, telefone").order("nome"),
    supabase
      .from("resultados_grupo")
      .select("grupo_id, data")
      .gte("data", `${mesAnterior}-01`)
      .lt("data", `${hoje.slice(0, 7)}-01`),
    supabase.from("onboardings").select("grupo_id"),
    supabase.from("tipos_entrega").select("id").eq("ativo", true),
    supabase.from("entregas_grupo").select("grupo_id, tipo_entrega_id, feito"),
  ]);

  const todos = grupos ?? [];
  const ativos = todos.filter((g) => g.status === "Ativo");
  const nomePorGrupo = new Map(todos.map((g) => [g.id, displayGroupName(g.nome)]));

  type ReuniaoRow = { id: string; grupo_id: string; data: string; compareceu: boolean; hora: string | null };
  type ParticipanteRow = { reuniao_id: string; mentorados: { grupo_id: string } | null };
  const reunioesRows = (reunioes ?? []) as ReuniaoRow[];
  const gruposPorReuniao = calcularGruposPorReuniao(
    reunioesRows,
    (participantes ?? []) as unknown as ParticipanteRow[]
  );

  const mentoradosPorGrupo = new Map<string, MentoradoContato[]>();
  for (const m of mentorados ?? []) {
    const lista = mentoradosPorGrupo.get(m.grupo_id) ?? [];
    lista.push({ nome: m.nome, telefone: m.telefone });
    mentoradosPorGrupo.set(m.grupo_id, lista);
  }

  const comResultadoNoMes = new Set((resultados ?? []).map((r) => r.grupo_id));
  const comOnboarding = new Set((onboardings ?? []).map((o) => o.grupo_id));

  const idsProcessos = new Set((processosAtivos ?? []).map((p) => p.id));
  const feitosPorGrupo = new Map<string, Set<string>>();
  for (const e of entregas ?? []) {
    if (!e.feito || !idsProcessos.has(e.tipo_entrega_id)) continue;
    const s = feitosPorGrupo.get(e.grupo_id) ?? new Set<string>();
    s.add(e.tipo_entrega_id);
    feitosPorGrupo.set(e.grupo_id, s);
  }

  return {
    reuniaoHoje: reunioesRows
      .filter((r) => r.data === hoje && r.compareceu)
      .map((r) => ({
        reuniaoId: r.id,
        grupoId: r.grupo_id,
        grupoNome: nomePorGrupo.get(r.grupo_id) ?? "—",
        hora: r.hora,
      })),
    reuniao: calcularGruposParaAgendar(ativos, reunioesRows, gruposPorReuniao, hoje, DIAS_PARA_AGENDAR).map(
      (g) => ({ grupoId: g.id, grupoNome: displayGroupName(g.nome), diasSemReuniao: g.diasSemReuniao })
    ),
    pagamento: (atrasados ?? []).map((p) => ({
      pagamentoId: p.id,
      grupoId: p.grupo_id,
      grupoNome: nomePorGrupo.get(p.grupo_id) ?? "—",
      valor: Number(p.valor),
      vencimento: p.data,
      mentorados: mentoradosPorGrupo.get(p.grupo_id) ?? [],
    })),
    resultados: ativos
      .filter((g) => g.trafego_pago === "SIM" && !comResultadoNoMes.has(g.id))
      .map((g) => ({ grupoId: g.id, grupoNome: displayGroupName(g.nome), mes: mesAnterior })),
    onboarding: ativos
      .filter((g) => !comOnboarding.has(g.id))
      .map((g) => ({ grupoId: g.id, grupoNome: displayGroupName(g.nome) })),
    processos: ativos
      .map((g) => ({
        grupoId: g.id,
        grupoNome: displayGroupName(g.nome),
        pendentes: idsProcessos.size - (feitosPorGrupo.get(g.id)?.size ?? 0),
      }))
      .filter((g) => g.pendentes > 0),
    // Sem data de fim de contrato, não calcula nada.
    renovacao: ativos
      .filter((g) => !!g.data_fim_contrato)
      .map((g) => ({
        grupoId: g.id,
        grupoNome: displayGroupName(g.nome),
        fim: g.data_fim_contrato!,
        dias: diasAteData(g.data_fim_contrato!, hoje),
      }))
      .filter((g) => g.dias <= DIAS_AVISO_RENOVACAO)
      .sort((a, b) => a.dias - b.dias),
  };
});
