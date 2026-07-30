import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatDate } from "@/lib/format";
import { NovoPagamentoForm } from "@/components/NovoPagamentoForm";
import { PagamentoParceladoForm } from "@/components/PagamentoParceladoForm";
import { AsaasCustomerIdField } from "@/components/AsaasCustomerIdField";
import { StatusBadge } from "@/components/StatusBadge";
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

  const hojeISO = new Date().toISOString().slice(0, 10);

  const linhas = (pagamentos ?? []).map((p) => ({
    id: p.id,
    data: p.data,
    tipoLabel: TIPO_LABEL[p.tipo] ?? p.tipo,
    valor: Number(p.valor),
    observacao: p.observacao,
    viaAsaas: !!p.asaas_payment_id,
    atrasado: p.status === "PENDENTE" && p.data < hojeISO,
    pago: p.status === "PAGO",
  }));

  const totalRecebido = linhas
    .filter((l) => l.pago)
    .reduce((acc, l) => acc + l.valor, 0);
  const totalEmAtraso = linhas
    .filter((l) => l.atrasado)
    .reduce((acc, l) => acc + l.valor, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-sm text-text-secondary">Total recebido</p>
            <p className="font-display text-2xl font-bold tracking-tight tabular-nums text-status-ok-text">
              {formatBRL(totalRecebido)}
            </p>
          </div>
          {totalEmAtraso > 0 && (
            <div>
              <p className="text-sm text-text-secondary">Em atraso</p>
              <p className="font-display text-2xl font-bold tracking-tight tabular-nums text-status-alert-text">
                {formatBRL(totalEmAtraso)}
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <NovoPagamentoForm grupoId={id} valorSugerido={Number(grupo?.valor_mensal ?? 0)} />
          <PagamentoParceladoForm grupoId={id} />
        </div>
      </div>
      <p className="max-w-md text-xs text-text-secondary">
        Todo pagamento é lançado manualmente aqui, ou entra sozinho via
        integração com o Asaas — boletos ainda não pagos aparecem como
        Pendente/Atrasado e não contam no total recebido.
      </p>

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
              <th className="px-4 py-3 font-medium">Status</th>
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
                <td className="px-4 py-3">
                  {l.pago ? (
                    <StatusBadge label="Pago" variant="ok" />
                  ) : l.atrasado ? (
                    <StatusBadge label="Atrasado" variant="alert" />
                  ) : (
                    <StatusBadge label="Pendente" variant="neutral" />
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
                <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
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
