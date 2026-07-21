import { createClient } from "@/lib/supabase/server";
import { TiposEntregaList } from "@/components/TiposEntregaList";

export default async function TiposEntregaPage() {
  const supabase = await createClient();

  const { data: tipos } = await supabase
    .from("tipos_entrega")
    .select("*")
    .order("nome");

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
        Tipos de entrega
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Ao adicionar um novo tipo, ele passa a aparecer no checklist de todos os
        grupos existentes. Desativar não apaga o histórico já registrado.
      </p>
      <div className="mt-6">
        <TiposEntregaList tipos={tipos ?? []} />
      </div>
    </div>
  );
}
