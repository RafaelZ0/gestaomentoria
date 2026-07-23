"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PrioridadeTarefa } from "@/lib/database.types";

function parsePrioridade(valor: FormDataEntryValue | null): PrioridadeTarefa {
  return valor === "Baixa" || valor === "Alta" ? valor : "Média";
}

export async function createTarefa(grupoId: string, formData: FormData) {
  const supabase = await createClient();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const prazo = String(formData.get("prazo") ?? "").trim() || null;
  const prioridade = parsePrioridade(formData.get("prioridade"));
  const responsavelIdRaw = String(formData.get("responsavel_id") ?? "").trim();
  const responsavel_id = responsavelIdRaw || null;

  if (!descricao) return;

  await supabase.from("tarefas").insert({
    grupo_id: grupoId,
    descricao,
    prazo,
    prioridade,
    responsavel_id,
  });
  revalidatePath(`/grupos/${grupoId}/tarefas`);
  revalidatePath(`/grupos/${grupoId}`);
}

export async function updateTarefa(
  grupoId: string,
  tarefaId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const prazo = String(formData.get("prazo") ?? "").trim() || null;
  const prioridade = parsePrioridade(formData.get("prioridade"));
  const responsavelIdRaw = String(formData.get("responsavel_id") ?? "").trim();
  const responsavel_id = responsavelIdRaw || null;

  if (!descricao) {
    throw new Error("Descreva a tarefa.");
  }

  await supabase
    .from("tarefas")
    .update({ descricao, prazo, prioridade, responsavel_id })
    .eq("id", tarefaId);

  revalidatePath(`/grupos/${grupoId}/tarefas`);
  revalidatePath(`/grupos/${grupoId}`);
}

export async function toggleTarefa(
  grupoId: string,
  tarefaId: string,
  concluida: boolean
) {
  const supabase = await createClient();
  await supabase.from("tarefas").update({ concluida }).eq("id", tarefaId);
  revalidatePath(`/grupos/${grupoId}/tarefas`);
  revalidatePath(`/grupos/${grupoId}`);
}

export async function removeTarefa(grupoId: string, tarefaId: string) {
  const supabase = await createClient();
  await supabase.from("tarefas").delete().eq("id", tarefaId);
  revalidatePath(`/grupos/${grupoId}/tarefas`);
  revalidatePath(`/grupos/${grupoId}`);
}
