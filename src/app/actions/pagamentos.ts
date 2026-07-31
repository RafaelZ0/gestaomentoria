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

export async function createPagamentoCartao(
  grupoId: string,
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  const valorTotal = Number(formData.get("valorTotal") ?? 0);
  const data = String(formData.get("data") ?? "");

  if (!data || !valorTotal) {
    return { ok: false, error: "Data e valor total são obrigatórios." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("pagamentos").insert({
    grupo_id: grupoId,
    data,
    valor: valorTotal,
    tipo: "MENSALIDADE",
    observacao: "Pago no cartão (cliente parcelou em 12x, valor recebido integral)",
  });

  if (error) {
    return { ok: false, error: "Erro ao lançar o pagamento." };
  }

  revalidatePath(`/grupos/${grupoId}/pagamentos`);
  revalidatePath("/grupos");
  revalidatePath("/financas");

  return { ok: true };
}
