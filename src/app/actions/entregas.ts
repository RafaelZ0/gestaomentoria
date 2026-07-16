"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleEntrega(
  grupoId: string,
  entregaId: string,
  feito: boolean
) {
  const supabase = await createClient();

  await supabase
    .from("entregas_grupo")
    .update({
      feito,
      data_feito: feito ? new Date().toISOString().slice(0, 10) : null,
      reuniao_id: feito ? null : null,
    })
    .eq("id", entregaId);

  revalidatePath(`/grupos/${grupoId}`);
}
