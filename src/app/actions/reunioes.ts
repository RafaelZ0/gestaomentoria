"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createReuniao(grupoId: string, formData: FormData) {
  const supabase = await createClient();

  const data = String(formData.get("data") ?? "").trim();
  const resumo = String(formData.get("resumo") ?? "").trim();
  const entregasFeitas = formData.getAll("entrega_feita").map(String);

  if (!resumo) {
    throw new Error("Descreva um resumo da reunião.");
  }

  const { data: reuniao, error } = await supabase
    .from("reunioes")
    .insert({
      grupo_id: grupoId,
      resumo,
      ...(data ? { data } : {}),
    })
    .select("*")
    .single();

  if (error || !reuniao) {
    throw new Error(error?.message ?? "Erro ao registrar reunião.");
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

  revalidatePath(`/grupos/${grupoId}`);
  revalidatePath(`/grupos/${grupoId}/reunioes`);
}
