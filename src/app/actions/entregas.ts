"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleEntrega(
  grupoId: string,
  entregaId: string,
  feito: boolean,
  data?: string
) {
  const supabase = await createClient();

  await supabase
    .from("entregas_grupo")
    .update({
      feito,
      data_feito: feito ? data || new Date().toISOString().slice(0, 10) : null,
      reuniao_id: null,
    })
    .eq("id", entregaId);

  revalidatePath(`/grupos/${grupoId}`);
}

export async function updateEntregaData(
  grupoId: string,
  entregaId: string,
  data: string
) {
  const supabase = await createClient();

  await supabase
    .from("entregas_grupo")
    .update({ data_feito: data })
    .eq("id", entregaId);

  revalidatePath(`/grupos/${grupoId}`);
}
