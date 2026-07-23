"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TrafegoPago } from "@/lib/database.types";

export async function createGrupo(formData: FormData) {
  const supabase = await createClient();

  const nome = String(formData.get("nome") ?? "").trim();
  const data_inicio = String(formData.get("data_inicio") ?? "");
  const trafego_pago = (formData.get("trafego_pago") as TrafegoPago) || null;
  const valor_mensal = Number(formData.get("valor_mensal") ?? 0);
  const observacoes = String(formData.get("observacoes") ?? "").trim() || null;

  if (!nome || !data_inicio) {
    throw new Error("Nome e data de início são obrigatórios.");
  }

  const { data: grupo, error } = await supabase
    .from("grupos_gestao")
    .insert({ nome, data_inicio, trafego_pago, valor_mensal, observacoes })
    .select("*")
    .single();

  if (error || !grupo) {
    throw new Error(error?.message ?? "Erro ao criar grupo.");
  }

  const nomes = formData.getAll("mentorado_nome").map(String);
  const telefones = formData.getAll("mentorado_telefone").map(String);
  const mentorados = nomes
    .map((nome, i) => ({ nome: nome.trim(), telefone: telefones[i]?.trim() || null }))
    .filter((m) => m.nome.length > 0)
    .map((m) => ({ ...m, grupo_id: grupo.id }));

  if (mentorados.length > 0) {
    await supabase.from("mentorados").insert(mentorados);
  }

  const { data: tipos } = await supabase
    .from("tipos_entrega")
    .select("*")
    .eq("ativo", true);

  if (tipos && tipos.length > 0) {
    await supabase.from("entregas_grupo").insert(
      tipos.map((t) => ({ grupo_id: grupo.id, tipo_entrega_id: t.id }))
    );
  }

  revalidatePath("/grupos");
  redirect(`/grupos/${grupo.id}`);
}

export async function updateGrupoCampo(
  grupoId: string,
  campo:
    | "nome"
    | "data_inicio"
    | "valor_mensal"
    | "observacoes"
    | "meta_cpl"
    | "meta_roas",
  valor: string
) {
  const supabase = await createClient();

  const updates =
    campo === "valor_mensal" || campo === "meta_cpl" || campo === "meta_roas"
      ? { [campo]: valor.trim() === "" ? null : Number(valor) }
      : campo === "observacoes"
        ? { observacoes: valor.trim() || null }
        : { [campo]: valor };

  await supabase.from("grupos_gestao").update(updates).eq("id", grupoId);

  revalidatePath(`/grupos/${grupoId}`);
  revalidatePath("/grupos");
}

export async function updateTrafego(grupoId: string, formData: FormData) {
  const supabase = await createClient();

  const trafego_pago = (formData.get("trafego_pago") as TrafegoPago) || null;
  const trafego_pago_desde =
    String(formData.get("trafego_pago_desde") ?? "").trim() || null;
  const valorInvestidoRaw = String(formData.get("valor_investido_dia") ?? "").trim();
  const valor_investido_dia = valorInvestidoRaw ? Number(valorInvestidoRaw) : null;

  await supabase
    .from("grupos_gestao")
    .update({ trafego_pago, trafego_pago_desde, valor_investido_dia })
    .eq("id", grupoId);

  revalidatePath(`/grupos/${grupoId}`);
  revalidatePath("/grupos");
}

export async function cancelarGrupo(
  grupoId: string,
  aplicarClausula: boolean,
  dataCancelamento?: string
) {
  const supabase = await createClient();

  const { data: grupo } = await supabase
    .from("grupos_gestao")
    .select("*")
    .eq("id", grupoId)
    .single();

  const data = dataCancelamento || new Date().toISOString().slice(0, 10);

  await supabase
    .from("grupos_gestao")
    .update({ status: "Inativo", data_termino: data })
    .eq("id", grupoId);

  if (aplicarClausula && grupo) {
    await supabase.from("pagamentos").insert({
      grupo_id: grupoId,
      data,
      valor: grupo.valor_mensal,
      tipo: "CLAUSULA_CANCELAMENTO",
      observacao: "Parcela da cláusula de cancelamento",
    });
  }

  revalidatePath(`/grupos/${grupoId}`);
  revalidatePath("/grupos");
}

export async function reativarGrupo(grupoId: string) {
  const supabase = await createClient();

  await supabase
    .from("grupos_gestao")
    .update({ status: "Ativo", data_termino: null })
    .eq("id", grupoId);

  revalidatePath(`/grupos/${grupoId}`);
  revalidatePath("/grupos");
}

export async function addMentorado(grupoId: string, formData: FormData) {
  const supabase = await createClient();
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim() || null;

  if (!nome) return;

  await supabase.from("mentorados").insert({ grupo_id: grupoId, nome, telefone });
  revalidatePath(`/grupos/${grupoId}`);
}

export async function removeMentorado(grupoId: string, mentoradoId: string) {
  const supabase = await createClient();
  await supabase.from("mentorados").delete().eq("id", mentoradoId);
  revalidatePath(`/grupos/${grupoId}`);
}

export async function updateMentorado(
  grupoId: string,
  mentoradoId: string,
  nome: string,
  telefone: string
) {
  const supabase = await createClient();
  await supabase
    .from("mentorados")
    .update({ nome: nome.trim(), telefone: telefone.trim() || null })
    .eq("id", mentoradoId);
  revalidatePath(`/grupos/${grupoId}`);
}
