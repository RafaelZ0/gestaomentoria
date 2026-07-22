import { createClient } from "@/lib/supabase/server";
import { TiposEntregaList } from "@/components/TiposEntregaList";
import { ProcessosMatrix } from "@/components/ProcessosMatrix";

export default async function ProcessosPage() {
  const supabase = await createClient();

  const [{ data: tipos }, { data: grupos }, { data: entregas }] = await Promise.all([
    supabase.from("tipos_entrega").select("*").order("nome"),
    supabase
      .from("grupos_gestao")
      .select("id, nome, status, trafego_pago")
      .order("nome"),
    supabase.from("entregas_grupo").select("grupo_id, tipo_entrega_id, feito"),
  ]);

  return (
    <div className="max-w-6xl space-y-10">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
          Processos
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Ao adicionar um novo processo, ele passa a aparecer no checklist de
          todos os grupos existentes. Desativar não apaga o histórico já
          registrado.
        </p>
        <div className="mt-6 max-w-3xl">
          <TiposEntregaList tipos={tipos ?? []} />
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Processos por grupo
        </h2>
        <p className="mt-1 text-xs text-text-secondary">
          Veja de uma vez quais processos cada grupo já tem e quais faltam, ou
          filtre por processo (ex: quantos grupos não fizeram Campanha
          Interna) e por status do grupo.
        </p>
        <div className="mt-3">
          <ProcessosMatrix
            grupos={(grupos ?? []).map((g) => ({
              id: g.id,
              nome: g.nome,
              status: g.status,
              trafego_pago: g.trafego_pago,
            }))}
            processos={tipos ?? []}
            entregas={(entregas ?? []).map((e) => ({
              grupo_id: e.grupo_id,
              tipo_entrega_id: e.tipo_entrega_id,
              feito: e.feito,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
