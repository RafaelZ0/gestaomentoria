"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TipoLancamento } from "@/lib/database.types";

export async function createLancamento(formData: FormData) {
  const supabase = await createClient();

  const tipo = String(formData.get("tipo") ?? "") as TipoLancamento;
  const descricao = String(formData.get("descricao") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim() || null;
  const valor = Number(formData.get("valor") ?? 0);
  const data = String(formData.get("data") ?? "") || undefined;

  if (!descricao || !valor || (tipo !== "RECEITA" && tipo !== "DESPESA")) {
    throw new Error("Preencha tipo, descrição e valor.");
  }

  await supabase.from("lancamentos_financeiros").insert({
    tipo,
    descricao,
    categoria,
    valor,
    ...(data ? { data } : {}),
  });

  revalidatePath("/financas");
}

export async function updateLancamento(
  lancamentoId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const tipo = String(formData.get("tipo") ?? "") as TipoLancamento;
  const descricao = String(formData.get("descricao") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim() || null;
  const valor = Number(formData.get("valor") ?? 0);
  const data = String(formData.get("data") ?? "");

  if (!descricao || !valor || (tipo !== "RECEITA" && tipo !== "DESPESA")) {
    throw new Error("Preencha tipo, descrição e valor.");
  }

  await supabase
    .from("lancamentos_financeiros")
    .update({ tipo, descricao, categoria, valor, data })
    .eq("id", lancamentoId);

  revalidatePath("/financas");
}

export async function removeLancamento(lancamentoId: string) {
  const supabase = await createClient();
  await supabase.from("lancamentos_financeiros").delete().eq("id", lancamentoId);
  revalidatePath("/financas");
}

export async function upsertCustoFixoMensal(
  ano: number,
  mes: number,
  valor: number
) {
  const supabase = await createClient();
  await supabase
    .from("custos_fixos_mensais")
    .upsert({ ano, mes, valor, updated_at: new Date().toISOString() });
  revalidatePath("/financas");
}

export async function removeCustoFixoMensal(ano: number, mes: number) {
  const supabase = await createClient();
  await supabase
    .from("custos_fixos_mensais")
    .delete()
    .eq("ano", ano)
    .eq("mes", mes);
  revalidatePath("/financas");
}
