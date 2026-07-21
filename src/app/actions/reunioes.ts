"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// A reunião aparece automaticamente na aba "Reuniões" de todo grupo que
// tiver um mentorado participante, então revalidamos o grupo de origem e o
// grupo de cada participante (antigo e novo, no caso de uma edição).
async function revalidarGruposDaReuniao(
  supabase: SupabaseClient,
  grupoIdOrigem: string,
  mentoradoIds: string[]
) {
  const grupos = new Set([grupoIdOrigem]);
  if (mentoradoIds.length > 0) {
    const { data: mentorados } = await supabase
      .from("mentorados")
      .select("grupo_id")
      .in("id", mentoradoIds);
    for (const m of mentorados ?? []) {
      grupos.add(m.grupo_id);
    }
  }
  for (const id of grupos) {
    revalidatePath(`/grupos/${id}`);
    revalidatePath(`/grupos/${id}/reunioes`);
  }
}

export async function createReuniao(grupoId: string, formData: FormData) {
  const supabase = await createClient();

  const data = String(formData.get("data") ?? "").trim();
  const resumo = String(formData.get("resumo") ?? "").trim();
  const entregasFeitas = formData.getAll("entrega_feita").map(String);
  const participantes = formData.getAll("participante_id").map(String);
  const responsavelIdRaw = String(formData.get("responsavel_id") ?? "").trim();
  const responsavel_id = responsavelIdRaw || null;

  if (!resumo) {
    throw new Error("Descreva um resumo da reunião.");
  }

  const { data: reuniao, error } = await supabase
    .from("reunioes")
    .insert({
      grupo_id: grupoId,
      resumo,
      responsavel_id,
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

  if (entregasFeitas.length > 0) {
    await supabase
      .from("entregas_grupo")
      .update({
        feito: true,
        data_feito: reuniao.data,
        reuniao_id: reuniao.id,
      })
      .in("id", entregasFeitas);
  }

  await revalidarGruposDaReuniao(supabase, grupoId, participantes);
}

export async function updateReuniao(reuniaoId: string, formData: FormData) {
  const supabase = await createClient();

  const data = String(formData.get("data") ?? "").trim();
  const resumo = String(formData.get("resumo") ?? "").trim();
  const participantes = formData.getAll("participante_id").map(String);
  const responsavelIdRaw = String(formData.get("responsavel_id") ?? "").trim();
  const responsavel_id = responsavelIdRaw || null;

  if (!resumo) {
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
  await revalidarGruposDaReuniao(supabase, reuniao.grupo_id, [
    ...idsAntigos,
    ...participantes,
  ]);
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

  // Entregas marcadas como feitas nesta reunião voltam a ficar pendentes,
  // já que a reunião que as gerou está sendo excluída.
  await supabase
    .from("entregas_grupo")
    .update({ feito: false, data_feito: null, reuniao_id: null })
    .eq("reuniao_id", reuniaoId);

  const { error } = await supabase.from("reunioes").delete().eq("id", reuniaoId);

  if (error) {
    throw new Error(error.message);
  }

  if (reuniao) {
    await revalidarGruposDaReuniao(
      supabase,
      reuniao.grupo_id,
      (participantes ?? []).map((p) => p.mentorado_id)
    );
  }
}
