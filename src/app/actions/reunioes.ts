"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  calcularConflitos,
  minutosDoHorario,
  type Conflito,
} from "@/lib/agendaConflitos";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function gruposDosMentorados(
  supabase: SupabaseClient,
  mentoradoIds: string[]
): Promise<string[]> {
  if (mentoradoIds.length === 0) return [];
  const { data } = await supabase
    .from("mentorados")
    .select("grupo_id")
    .in("id", mentoradoIds);
  return (data ?? []).map((m) => m.grupo_id);
}

// A reunião aparece automaticamente na aba "Reuniões" de todo grupo que
// tiver um mentorado participante, então revalidamos cada um deles, além
// da página global /reunioes que lista tudo junto.
function revalidarGrupos(grupoIds: Iterable<string>) {
  for (const id of grupoIds) {
    revalidatePath(`/grupos/${id}`);
    revalidatePath(`/grupos/${id}/reunioes`);
  }
  revalidatePath("/reunioes");
}

export async function createReuniao(grupoId: string, formData: FormData) {
  const supabase = await createClient();

  const data = String(formData.get("data") ?? "").trim();
  const resumo = String(formData.get("resumo") ?? "").trim();
  const compareceu = formData.get("nao_compareceu") !== "on";
  const linkReuniaoRaw = String(formData.get("link_reuniao") ?? "").trim();
  const link_reuniao = linkReuniaoRaw || null;
  const horaRaw = String(formData.get("hora") ?? "").trim();
  const hora = horaRaw || null;
  const duracaoRaw = String(formData.get("duracao_min") ?? "").trim();
  const duracao_min = duracaoRaw ? Number(duracaoRaw) : 60;
  const entregasFeitas = formData.getAll("entrega_feita").map(String);
  const participantes = formData.getAll("participante_id").map(String);
  const responsavelIdRaw = String(formData.get("responsavel_id") ?? "").trim();
  const responsavel_id = responsavelIdRaw || null;

  const hoje = new Date().toISOString().slice(0, 10);
  const agendada = !!data && data > hoje;

  if (compareceu && !agendada && !resumo) {
    throw new Error("Descreva um resumo da reunião.");
  }

  const { data: reuniao, error } = await supabase
    .from("reunioes")
    .insert({
      grupo_id: grupoId,
      resumo,
      responsavel_id,
      compareceu,
      link_reuniao,
      hora,
      duracao_min,
      ...(data ? { data } : {}),
    })
    .select("*")
    .single();

  if (error || !reuniao) {
    throw new Error(error?.message ?? "Erro ao registrar reunião.");
  }

  if (participantes.length > 0) {
    await supabase.from("reuniao_participantes").insert(
      participantes.map((mentoradoId) => ({
        reuniao_id: reuniao.id,
        mentorado_id: mentoradoId,
      }))
    );
  }

  const gruposParticipantes = await gruposDosMentorados(supabase, participantes);
  const gruposEnvolvidos = [...new Set([grupoId, ...gruposParticipantes])];

  // Marca o processo como feito em todos os grupos envolvidos na reunião
  // (não só no grupo de origem), já que participantes de outros grupos
  // também fizeram a entrega junto.
  if (entregasFeitas.length > 0) {
    await supabase
      .from("entregas_grupo")
      .update({
        feito: true,
        data_feito: reuniao.data,
        reuniao_id: reuniao.id,
      })
      .in("grupo_id", gruposEnvolvidos)
      .in("tipo_entrega_id", entregasFeitas);
  }

  revalidarGrupos(gruposEnvolvidos);
}

export type ResultadoAgendamento =
  | { ok: true }
  | { ok: false; error: string; conflitos?: Conflito[] };

// Agendamento pela grade da /agenda. Retorna {ok, error} em vez de throw
// (erro lançado não chega no cliente via startTransition nesta versão).
export async function agendarReuniao(input: {
  grupoId: string;
  responsavelId: string;
  data: string;
  hora: string;
  duracaoMin: number;
  linkReuniao: string;
  resumo: string;
  forcarEncaixe: boolean;
}): Promise<ResultadoAgendamento> {
  const { grupoId, responsavelId, data, hora, duracaoMin, forcarEncaixe } = input;

  if (!grupoId) return { ok: false, error: "Escolha o grupo." };
  if (!responsavelId) return { ok: false, error: "Escolha o responsável." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { ok: false, error: "Data inválida." };
  if (!/^\d{2}:\d{2}$/.test(hora)) return { ok: false, error: "Horário inválido." };
  if (!Number.isFinite(duracaoMin) || duracaoMin < 5 || duracaoMin > 12 * 60) {
    return { ok: false, error: "Duração inválida." };
  }
  if (minutosDoHorario(hora) + duracaoMin > 24 * 60) {
    return { ok: false, error: "A reunião passaria da meia-noite." };
  }

  const supabase = await createClient();

  const [{ data: responsaveis }, { data: reunioesDoDia }] = await Promise.all([
    supabase.from("responsaveis").select("id, nome"),
    supabase
      .from("reunioes")
      .select("id, hora, duracao_min, responsavel_id, grupos_gestao(nome)")
      .eq("data", data)
      .not("hora", "is", null),
  ]);

  if (!(responsaveis ?? []).some((r) => r.id === responsavelId)) {
    return { ok: false, error: "Responsável não encontrado." };
  }
  const pabloId =
    (responsaveis ?? []).find((r) => r.nome.trim().toLowerCase() === "pablo")?.id ??
    null;

  if (!forcarEncaixe) {
    type Row = {
      id: string;
      hora: string;
      duracao_min: number;
      responsavel_id: string | null;
      grupos_gestao: { nome: string } | null;
    };
    const conflitos = calcularConflitos({
      data,
      hora,
      duracaoMin,
      responsavelId,
      pabloId,
      reunioesDoDia: ((reunioesDoDia ?? []) as unknown as Row[]).map((r) => ({
        id: r.id,
        hora: r.hora.slice(0, 5),
        duracaoMin: r.duracao_min,
        responsavelId: r.responsavel_id,
        grupoNome: r.grupos_gestao?.nome ?? "—",
      })),
    });
    if (conflitos.length > 0) {
      return {
        ok: false,
        error: "Esse horário tem conflito. Marque \"Forçar encaixe\" pra salvar mesmo assim.",
        conflitos,
      };
    }
  }

  const { error } = await supabase.from("reunioes").insert({
    grupo_id: grupoId,
    data,
    hora,
    duracao_min: duracaoMin,
    responsavel_id: responsavelId,
    link_reuniao: input.linkReuniao.trim() || null,
    resumo: input.resumo.trim(),
    compareceu: true,
  });

  if (error) return { ok: false, error: error.message };

  revalidarGrupos([grupoId]);
  revalidatePath("/agenda");
  return { ok: true };
}

export async function updateReuniao(reuniaoId: string, formData: FormData) {
  const supabase = await createClient();

  const data = String(formData.get("data") ?? "").trim();
  const resumo = String(formData.get("resumo") ?? "").trim();
  const compareceu = formData.get("nao_compareceu") !== "on";
  const linkReuniaoRaw = String(formData.get("link_reuniao") ?? "").trim();
  const link_reuniao = linkReuniaoRaw || null;
  const horaRaw = String(formData.get("hora") ?? "").trim();
  const hora = horaRaw || null;
  const duracaoRaw = String(formData.get("duracao_min") ?? "").trim();
  const duracao_min = duracaoRaw ? Number(duracaoRaw) : 60;
  const participantes = formData.getAll("participante_id").map(String);
  const responsavelIdRaw = String(formData.get("responsavel_id") ?? "").trim();
  const responsavel_id = responsavelIdRaw || null;

  const hoje = new Date().toISOString().slice(0, 10);
  const agendada = !!data && data > hoje;

  if (compareceu && !agendada && !resumo) {
    throw new Error("Descreva um resumo da reunião.");
  }

  const { data: participantesAntigos } = await supabase
    .from("reuniao_participantes")
    .select("mentorado_id")
    .eq("reuniao_id", reuniaoId);

  const { data: reuniao, error } = await supabase
    .from("reunioes")
    .update({
      resumo,
      responsavel_id,
      compareceu,
      link_reuniao,
      hora,
      duracao_min,
      ...(data ? { data } : {}),
    })
    .eq("id", reuniaoId)
    .select("*")
    .single();

  if (error || !reuniao) {
    throw new Error(error?.message ?? "Erro ao atualizar reunião.");
  }

  await supabase
    .from("reuniao_participantes")
    .delete()
    .eq("reuniao_id", reuniaoId);

  if (participantes.length > 0) {
    await supabase.from("reuniao_participantes").insert(
      participantes.map((mentoradoId) => ({
        reuniao_id: reuniaoId,
        mentorado_id: mentoradoId,
      }))
    );
  }

  const idsAntigos = (participantesAntigos ?? []).map((p) => p.mentorado_id);
  const gruposParticipantes = await gruposDosMentorados(supabase, [
    ...idsAntigos,
    ...participantes,
  ]);
  revalidarGrupos([reuniao.grupo_id, ...gruposParticipantes]);
}

export async function removeReuniao(reuniaoId: string) {
  const supabase = await createClient();

  const { data: reuniao } = await supabase
    .from("reunioes")
    .select("grupo_id")
    .eq("id", reuniaoId)
    .single();

  const { data: participantes } = await supabase
    .from("reuniao_participantes")
    .select("mentorado_id")
    .eq("reuniao_id", reuniaoId);

  // Entregas marcadas como feitas nesta reunião voltam a ficar pendentes
  // (em todos os grupos envolvidos), já que a reunião que as gerou está
  // sendo excluída.
  await supabase
    .from("entregas_grupo")
    .update({ feito: false, data_feito: null, reuniao_id: null })
    .eq("reuniao_id", reuniaoId);

  // O diagnóstico de onboarding continua existindo, só perde o vínculo com a
  // reunião (FK sem cascade).
  await supabase
    .from("onboardings")
    .update({ reuniao_id: null })
    .eq("reuniao_id", reuniaoId);

  const { error } = await supabase.from("reunioes").delete().eq("id", reuniaoId);

  if (error) {
    throw new Error(error.message);
  }

  if (reuniao) {
    const gruposParticipantes = await gruposDosMentorados(
      supabase,
      (participantes ?? []).map((p) => p.mentorado_id)
    );
    revalidarGrupos([reuniao.grupo_id, ...gruposParticipantes]);
  }
}
