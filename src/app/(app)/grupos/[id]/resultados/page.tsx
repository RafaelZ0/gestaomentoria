import { createClient } from "@/lib/supabase/server";
import { ResultadosList } from "@/components/ResultadosList";

export default async function ResultadosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: resultados } = await supabase
    .from("resultados_grupo")
    .select("*")
    .eq("grupo_id", id)
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });

  return <ResultadosList grupoId={id} resultados={resultados ?? []} />;
}
