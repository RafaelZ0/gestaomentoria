"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function lerCampos(formData: FormData) {
  return {
    data: String(formData.get("data") ?? "").trim() || new Date().toISOString().slice(0, 10),
    investimento: Number(formData.get("investimento") ?? 0),
    leads: Number(formData.get("leads") ?? 0),
    vendas: Number(formData.get("vendas") ?? 0),
    faturamento_campanha_interna: Number(
      formData.get("faturamento_campanha_interna") ?? 0
    ),
    faturamento_trafego_pago: Number(formData.get("faturamento_trafego_pago") ?? 0),
    observacao: String(formData.get("observacao") ?? "").trim() || null,
  };
}

export async function createResultado(grupoId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("resultados_grupo").insert({
    grupo_id: grupoId,
    ...lerCampos(formData),
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/grupos/${grupoId}/resultados`);
  revalidatePath("/resultados");
}

export async function updateResultado(
  resultadoId: string,
  grupoId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("resultados_grupo")
    .update(lerCampos(formData))
    .eq("id", resultadoId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/grupos/${grupoId}/resultados`);
  revalidatePath("/resultados");
}

export async function removeResultado(resultadoId: string, grupoId: string) {
  const supabase = await createClient();
  await supabase.from("resultados_grupo").delete().eq("id", resultadoId);
  revalidatePath(`/grupos/${grupoId}/resultados`);
  revalidatePath("/resultados");
}
