import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { NovaReuniaoForm } from "@/components/NovaReuniaoForm";

export default async function ReunioesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: reunioes }, { data: entregasPendentes }] = await Promise.all([
    supabase
      .from("reunioes")
      .select("*")
      .eq("grupo_id", id)
      .order("data", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("entregas_grupo")
      .select("id, tipos_entrega(id, nome, ativo)")
      .eq("grupo_id", id)
      .eq("feito", false),
  ]);

  type PendenteRow = {
    id: string;
    tipos_entrega: { id: string; nome: string; ativo: boolean } | null;
  };

  const pendentes = ((entregasPendentes ?? []) as unknown as PendenteRow[])
    .filter((e) => e.tipos_entrega?.ativo)
    .map((e) => ({ id: e.id, nome: e.tipos_entrega!.nome }));

  return (
    <div className="space-y-6">
      <NovaReuniaoForm grupoId={id} entregasPendentes={pendentes} />

      <ul className="space-y-3">
        {(reunioes ?? []).map((r) => (
          <li key={r.id} className="rounded-xl border border-border bg-bg-surface p-5">
            <p className="text-sm font-medium text-text-primary">{formatDate(r.data)}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">
              {r.resumo}
            </p>
          </li>
        ))}
        {(reunioes ?? []).length === 0 && (
          <p className="text-sm text-text-secondary">
            Nenhuma reunião registrada ainda.
          </p>
        )}
      </ul>
    </div>
  );
}
