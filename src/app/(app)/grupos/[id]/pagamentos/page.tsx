import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatDate } from "@/lib/format";
import { NovoPagamentoForm } from "@/components/NovoPagamentoForm";

const TIPO_LABEL: Record<string, string> = {
  MENSALIDADE: "Mensalidade",
  CLAUSULA_CANCELAMENTO: "Cláusula de cancelamento",
};

export default async function PagamentosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: grupo }, { data: pagamentos }] = await Promise.all([
    supabase.from("grupos_gestao").select("*").eq("id", id).single(),
    supabase
      .from("pagamentos")
      .select("*")
      .eq("grupo_id", id)
      .order("data", { ascending: false }),
  ]);

  const total = (pagamentos ?? []).reduce((acc, p) => acc + Number(p.valor), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-secondary">Total pago</p>
          <p className="font-display text-2xl font-bold tabular-nums text-text-primary">
            {formatBRL(total)}
          </p>
        </div>
        <NovoPagamentoForm grupoId={id} valorSugerido={Number(grupo?.valor_mensal ?? 0)} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Observação</th>
            </tr>
          </thead>
          <tbody>
            {(pagamentos ?? []).map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 tabular-nums text-text-primary">
                  {formatDate(p.data)}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {TIPO_LABEL[p.tipo] ?? p.tipo}
                </td>
                <td className="px-4 py-3 tabular-nums text-text-primary">
                  {formatBRL(Number(p.valor))}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {p.observacao ?? "—"}
                </td>
              </tr>
            ))}
            {(pagamentos ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">
                  Nenhum pagamento registrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
