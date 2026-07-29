import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatDate } from "@/lib/format";
import { NovoPagamentoForm } from "@/components/NovoPagamentoForm";
import { AsaasCustomerIdField } from "@/components/AsaasCustomerIdField";
import { getGrupo } from "@/lib/data/grupo";

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

  const [grupo, { data: pagamentos }] = await Promise.all([
    getGrupo(id),
    supabase
      .from("pagamentos")
      .select("*")
      .eq("grupo_id", id)
      .order("data", { ascending: false }),
  ]);

  const linhas = (pagamentos ?? []).map((p) => ({
    id: p.id,
    data: p.data,
    tipoLabel: TIPO_LABEL[p.tipo] ?? p.tipo,
    valor: Number(p.valor),
    observacao: p.observacao,
    viaAsaas: !!p.asaas_payment_id,
  }));

  const totalRecebido = linhas.reduce((acc, l) => acc + l.valor, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-text-secondary">Total recebido</p>
          <p className="font-display text-2xl font-bold tracking-tight tabular-nums text-status-ok-text">
            {formatBRL(totalRecebido)}
          </p>
          <p className="mt-2 max-w-md text-xs text-text-secondary">
            Todo pagamento é lançado manualmente aqui — não há geração
            automática de mensalidade.
          </p>
        </div>
        <NovoPagamentoForm grupoId={id} valorSugerido={Number(grupo?.valor_mensal ?? 0)} />
      </div>

      <AsaasCustomerIdField
        grupoId={id}
        asaasCustomerId={grupo?.asaas_customer_id ?? null}
      />

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
            {linhas.map((l) => (
              <tr key={l.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 tabular-nums text-text-primary">
                  {formatDate(l.data)}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {l.tipoLabel}
                  {l.viaAsaas && (
                    <span className="ml-2 rounded-full bg-status-accent-bg px-2 py-0.5 text-xs font-medium text-status-accent-text">
                      via Asaas
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums text-text-primary">
                  {formatBRL(l.valor)}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {l.observacao ?? "—"}
                </td>
              </tr>
            ))}
            {linhas.length === 0 && (
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
