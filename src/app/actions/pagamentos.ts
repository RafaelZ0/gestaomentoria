"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addMonths } from "@/lib/format";

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

const PARCELAS_CARTAO = 12;

export async function createPagamentoParcelado(
  grupoId: string,
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  const valorTotal = Number(formData.get("valorTotal") ?? 0);
  const dataInicial = String(formData.get("dataInicial") ?? "");

  if (!dataInicial || !valorTotal) {
    return { ok: false, error: "Data da 1ª parcela e valor total são obrigatórios." };
  }

  const [ano, mes, dia] = dataInicial.split("-").map(Number);
  const inicio = new Date(ano, mes - 1, dia);

  const centavosTotal = Math.round(valorTotal * 100);
  const centavosParcela = Math.floor(centavosTotal / PARCELAS_CARTAO);
  const resto = centavosTotal - centavosParcela * PARCELAS_CARTAO;

  const linhas = Array.from({ length: PARCELAS_CARTAO }, (_, i) => {
    const dataParcela = addMonths(inicio, i);
    const centavos = centavosParcela + (i === PARCELAS_CARTAO - 1 ? resto : 0);
    return {
      grupo_id: grupoId,
      data: dataParcela.toISOString().slice(0, 10),
      valor: centavos / 100,
      tipo: "MENSALIDADE" as const,
      observacao: `Parcela ${i + 1}/${PARCELAS_CARTAO} (cartão)`,
    };
  });

  const supabase = await createClient();
  const { error } = await supabase.from("pagamentos").insert(linhas);

  if (error) {
    return { ok: false, error: "Erro ao lançar as parcelas." };
  }

  revalidatePath(`/grupos/${grupoId}/pagamentos`);
  revalidatePath("/grupos");
  revalidatePath("/financas");

  return { ok: true };
}
