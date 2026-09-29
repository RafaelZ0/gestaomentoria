import { createClient } from "@/lib/supabase/server";
import { TiposEntregaList } from "@/components/TiposEntregaList";
import { ProcessosMatrix } from "@/components/ProcessosMatrix";
import { AjudaPopover, PageHeader } from "@/components/ui/PageHeader";

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
    <div className="mx-auto flex max-w-[960px] flex-col gap-12">
      <div className="flex flex-col gap-7">
        <PageHeader
          titulo="Processos"
          ajuda={
            <p>
              Ao adicionar um novo processo, ele passa a aparecer no checklist de todos os
              grupos existentes. Desativar não apaga o histórico já registrado.
            </p>
          }
        />
        <TiposEntregaList tipos={tipos ?? []} />
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold text-text">Processos por grupo</h2>
          <AjudaPopover>
            <p>
              Veja de uma vez quais processos cada grupo já tem e quais faltam, ou filtre por
              processo (ex: quantos grupos não fizeram Campanha Interna) e por status do grupo.
            </p>
          </AjudaPopover>
        </div>
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
      </section>
    </div>
  );
}