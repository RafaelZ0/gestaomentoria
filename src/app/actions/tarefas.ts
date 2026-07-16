"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createTarefa(grupoId: string, formData: FormData) {
  const supabase = await createClient();
  const descricao = String(formData.get("descricao") ?? "").trim();

  if (!descricao) return;

  await supabase.from("tarefas").insert({ grupo_id: grupoId, descricao });
  revalidatePath(`/grupos/${grupoId}/tarefas`);
}

export async function toggleTarefa(
  grupoId: string,
  tarefaId: string,
  concluida: boolean
) {
  const supabase = await createClient();
  await supabase.from("tarefas").update({ concluida }).eq("id", tarefaId);
  revalidatePath(`/grupos/${grupoId}/tarefas`);
}
