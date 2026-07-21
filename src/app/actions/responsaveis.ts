"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addResponsavel(nome: string) {
  const nomeLimpo = nome.trim();
  if (!nomeLimpo) {
    throw new Error("Informe o nome do responsável.");
  }

  const supabase = await createClient();
  const { data: responsavel, error } = await supabase
    .from("responsaveis")
    .insert({ nome: nomeLimpo })
    .select("*")
    .single();

  if (error || !responsavel) {
    throw new Error(error?.message ?? "Erro ao adicionar responsável.");
  }

  revalidatePath("/grupos");

  return responsavel;
}

export async function removeResponsavel(responsavelId: string) {
  const supabase = await createClient();
  await supabase.from("responsaveis").delete().eq("id", responsavelId);
  revalidatePath("/grupos");
}
