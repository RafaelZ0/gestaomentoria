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

export async function addCustoMensalItem(
  ano: number,
  mes: number,
  nome: string,
  valor: number
) {
  const nomeLimpo = nome.trim();
  if (!nomeLimpo || !valor) {
    throw new Error("Preencha nome e valor do custo.");
  }

  const supabase = await createClient();
  await supabase
    .from("custos_fixos_mensais_itens")
    .insert({ ano, mes, nome: nomeLimpo, valor });
  revalidatePath("/financas");
}

export async function removeCustoMensalItem(itemId: string) {
  const supabase = await createClient();
  await supabase
    .from("custos_fixos_mensais_itens")
    .delete()
    .eq("id", itemId);
  revalidatePath("/financas");
}
