"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createPagamento(grupoId: string, formData: FormData) {
  const supabase = await createClient();

  const data = String(formData.get("data") ?? "");
  const valor = Number(formData.get("valor") ?? 0);
  const observacao = String(formData.get("observacao") ?? "").trim() || null;

  if (!data || !valor) {
    throw new Error("Data e valor são obrigatórios.");
  }

  await supabase.from("pagamentos").insert({
    grupo_id: grupoId,
    data,
    valor,
    tipo: "MENSALIDADE",
    observacao,
  });

  revalidatePath(`/grupos/${grupoId}/pagamentos`);
  revalidatePath("/grupos");
}
