"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createTipoEntrega(formData: FormData) {
  const supabase = await createClient();
  const nome = String(formData.get("nome") ?? "").trim().toUpperCase();

  if (!nome) {
    throw new Error("Informe um nome para o tipo de entrega.");
  }

  const { data: tipo, error } = await supabase
    .from("tipos_entrega")
    .insert({ nome })
    .select("*")
    .single();

  if (error || !tipo) {
    throw new Error(error?.message ?? "Erro ao criar tipo de entrega.");
  }

  const { data: grupos } = await supabase.from("grupos_gestao").select("*");

  if (grupos && grupos.length > 0) {
    await supabase.from("entregas_grupo").insert(
      grupos.map((g) => ({ grupo_id: g.id, tipo_entrega_id: tipo.id }))
    );
  }

  revalidatePath("/tipos-entrega");
  revalidatePath("/grupos");
}

export async function toggleTipoEntregaAtivo(
  tipoId: string,
  ativo: boolean
) {
  const supabase = await createClient();
  await supabase.from("tipos_entrega").update({ ativo }).eq("id", tipoId);
  revalidatePath("/tipos-entrega");
}
