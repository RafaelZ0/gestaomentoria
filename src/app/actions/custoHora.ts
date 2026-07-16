"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCustoFixo(formData: FormData) {
  const supabase = await createClient();
  const nome = String(formData.get("nome") ?? "").trim();
  const valor = Number(formData.get("valor") ?? 0);

  if (!nome) {
    throw new Error("Informe um nome para o custo.");
  }

  await supabase.from("custos_fixos").insert({ nome, valor });
  revalidatePath("/custo-hora");
}

export async function updateCustoFixo(
  custoId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const nome = String(formData.get("nome") ?? "").trim();
  const valor = Number(formData.get("valor") ?? 0);

  if (!nome) {
    throw new Error("Informe um nome para o custo.");
  }

  await supabase
    .from("custos_fixos")
    .update({ nome, valor, updated_at: new Date().toISOString() })
    .eq("id", custoId);

  revalidatePath("/custo-hora");
}

export async function removeCustoFixo(custoId: string) {
  const supabase = await createClient();
  await supabase.from("custos_fixos").delete().eq("id", custoId);
  revalidatePath("/custo-hora");
}

export async function updateCustoHoraConfig(formData: FormData) {
  const supabase = await createClient();

  const horas_atendimento_mes = Number(
    formData.get("horas_atendimento_mes") ?? 0
  );
  const percentual_ociosidade = Number(
    formData.get("percentual_ociosidade") ?? 0
  );
  const percentual_fator_avaliacao = Number(
    formData.get("percentual_fator_avaliacao") ?? 0
  );

  await supabase
    .from("custo_hora_config")
    .update({
      horas_atendimento_mes,
      percentual_ociosidade,
      percentual_fator_avaliacao,
    })
    .eq("id", 1);

  revalidatePath("/custo-hora");
}
