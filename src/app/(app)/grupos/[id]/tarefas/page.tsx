import { createClient } from "@/lib/supabase/server";
import { TarefasList } from "@/components/TarefasList";

export default async function TarefasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: tarefas }, { data: responsaveis }] = await Promise.all([
    supabase
      .from("tarefas")
      .select("*")
      .eq("grupo_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("responsaveis").select("*").order("nome"),
  ]);

  return (
    <TarefasList
      grupoId={id}
      tarefas={tarefas ?? []}
      responsaveis={responsaveis ?? []}
    />
  );
}
