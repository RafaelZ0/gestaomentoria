"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

  // A reunião aparece automaticamente na aba "Reuniões" de todo grupo que
  // tiver um mentorado participante, então revalidamos também esses grupos.
  const gruposParaAtualizar = new Set([grupoId]);
  if (participantes.length > 0) {
    const { data: mentoradosParticipantes } = await supabase
      .from("mentorados")
      .select("grupo_id")
      .in("id", participantes);
    for (const m of mentoradosParticipantes ?? []) {
      gruposParaAtualizar.add(m.grupo_id);
    }
  }

  for (const id of gruposParaAtualizar) {
    revalidatePath(`/grupos/${id}`);
    revalidatePath(`/grupos/${id}/reunioes`);
  }
}
