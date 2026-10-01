"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function lerCampos(formData: FormData) {
  return {
    data: String(formData.get("data") ?? "").trim() || new Date().toISOString().slice(0, 10),
    investimento: Number(formData.get("investimento") ?? 0),
    leads: Number(formData.get("leads") ?? 0),
    vendas_campanha_interna: Number(formData.get("vendas_campanha_interna") ?? 0),
    vendas_trafego_pago: Number(formData.get("vendas_trafego_pago") ?? 0),
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

export type LinhaLote = {
  grupoId: string;
  resultadoId: string | null;
  investimento: number;
  leads: number;
  vendas_campanha_interna: number;
  vendas_trafego_pago: number;
  faturamento_campanha_interna: number;
  faturamento_trafego_pago: number;
  observacao: string;
};

// Lançamento em lote (tela "Lançar resultados"): grava só as linhas que o
// cliente mandou (as alteradas). Linha com lançamento existente no mês é
// atualizada (mantém a data dela); linha nova entra com o último dia do mês.
export async function salvarResultadosEmLote(
  mes: string,
  linhas: LinhaLote[]
): Promise<{ ok: true; salvos: number } | { ok: false; error: string }> {
  if (!/^\d{4}-\d{2}$/.test(mes)) return { ok: false, error: "Mês inválido." };
  const [ano, m] = mes.split("-").map(Number);
  const ultimoDia = new Date(ano, m, 0).getDate();
  const dataNova = `${mes}-${String(ultimoDia).padStart(2, "0")}`;

  const numeros = [
    "investimento",
    "leads",
    "vendas_campanha_interna",
    "vendas_trafego_pago",
    "faturamento_campanha_interna",
    "faturamento_trafego_pago",
  ] as const;
  for (const l of linhas) {
    if (numeros.some((k) => !Number.isFinite(l[k]) || l[k] < 0)) {
      return { ok: false, error: "Confira os valores: só números maiores ou iguais a zero." };
    }
  }

  const supabase = await createClient();
  const grupos = new Set<string>();

  for (const l of linhas) {
    const campos = {
      investimento: l.investimento,
      leads: l.leads,
      vendas_campanha_interna: l.vendas_campanha_interna,
      vendas_trafego_pago: l.vendas_trafego_pago,
      faturamento_campanha_interna: l.faturamento_campanha_interna,
      faturamento_trafego_pago: l.faturamento_trafego_pago,
      observacao: l.observacao.trim() || null,
    };
    const { error } = l.resultadoId
      ? await supabase.from("resultados_grupo").update(campos).eq("id", l.resultadoId)
      : await supabase.from("resultados_grupo").insert({ grupo_id: l.grupoId, data: dataNova, ...campos });
    if (error) return { ok: false, error: error.message };
    grupos.add(l.grupoId);
  }

  for (const g of grupos) revalidatePath(`/grupos/${g}/resultados`);
  revalidatePath("/resultados");
  revalidatePath("/resultados/lancar");
  revalidatePath("/", "layout");
  return { ok: true, salvos: linhas.length };
}

export async function removeResultado(resultadoId: string, grupoId: string) {
  const supabase = await createClient();
  await supabase.from("resultados_grupo").delete().eq("id", resultadoId);
  revalidatePath(`/grupos/${grupoId}/resultados`);
  revalidatePath("/resultados");
}
