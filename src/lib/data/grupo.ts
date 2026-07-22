import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Dedup via React cache(): layout.tsx e a page.tsx de cada aba do grupo
// chamam getGrupo(id) independentemente, mas dentro da mesma requisição
// isso vira uma única busca ao Supabase em vez de uma por componente.
export const getGrupo = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("grupos_gestao")
    .select("*")
    .eq("id", id)
    .single();
  return data;
});
