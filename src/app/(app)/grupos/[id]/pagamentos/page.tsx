import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatDate, datasVencimento } from "@/lib/format";
import { calcUltimoVencimento, statusMensalidade } from "@/lib/mensalidade";
import { NovoPagamentoForm } from "@/components/NovoPagamentoForm";
import { MensalidadeStatusCell } from "@/components/MensalidadeStatusCell";
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

  const [grupo, { data: pagamentos }, { data: mensalidadesPagas }] =
    await Promise.all([
      getGrupo(id),
      supabase
        .from("pagamentos")
        .select("*")
        .eq("grupo_id", id)
        .order("data", { ascending: false }),
      supabase.from("mensalidade_paga").select("data_vencimento").eq("grupo_id", id),
    ]);

  const pagasSet = new Set((mensalidadesPagas ?? []).map((m) => m.data_vencimento));

  const datasAutomaticas = grupo
    ? datasVencimento(
        new Date(grupo.data_inicio + "T00:00:00"),
        grupo.data_termino
          ? new Date(grupo.data_termino + "T00:00:00")
          : new Date(new Date().toDateString())
      ).map((d) => d.toISOString().slice(0, 10))
    : [];

  const ultimoVencimento = grupo
    ? calcUltimoVencimento(grupo.data_inicio, grupo.data_termino)
    : null;

  const linhasAutomaticas = grupo
    ? datasAutomaticas.map((data) => ({
        id: `auto-${data}`,
        data,
        tipoLabel: "Mensalidade (automática)",
        valor: Number(grupo.valor_mensal),
        observacao: null as string | null,
        automatica: true,
        status: statusMensalidade(data, ultimoVencimento, pagasSet.has(data)),
      }))
    : [];

  const linhasManuais = (pagamentos ?? []).map((p) => ({
    id: p.id,
    data: p.data,
    tipoLabel: TIPO_LABEL[p.tipo] ?? p.tipo,
    valor: Number(p.valor),
    observacao: p.observacao,
    automatica: false,
    status: "Pago" as const,
  }));

  const linhas = [...linhasAutomaticas, ...linhasManuais].sort((a, b) =>
    b.data.localeCompare(a.data)
  );

  const totalPrevisto = linhas.reduce((acc, l) => acc + l.valor, 0);
  const totalRecebido = linhas
    .filter((l) => l.status === "Pago")
    .reduce((acc, l) => acc + l.valor, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex gap-6">
            <div>
              <p className="text-sm text-text-secondary">Total recebido</p>
              <p className="font-display text-2xl font-bold tracking-tight tabular-nums text-status-ok-text">
                {formatBRL(totalRecebido)}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Total previsto</p>
              <p className="font-display text-2xl font-bold tracking-tight tabular-nums text-text-primary">
                {formatBRL(totalPrevisto)}
              </p>
            </div>
          </div>
          <p className="mt-2 max-w-md text-xs text-text-secondary">
            Mensalidades entram automaticamente com base na data de início e no
            valor mensal do grupo. Use o botão ao lado só para cláusulas ou
            ajustes extras.
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
              <th className="px-4 py-3 font-medium">Status</th>
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
                </td>
                <td className="px-4 py-3 tabular-nums text-text-primary">
                  {formatBRL(l.valor)}
                </td>
                <td className="px-4 py-3">
                  {l.automatica ? (
                    <MensalidadeStatusCell
                      grupoId={id}
                      dataVencimento={l.data}
                      status={l.status}
                    />
                  ) : (
                    <StatusBadge label="Pago" variant="ok" />
                  )}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {l.observacao ?? "—"}
                </td>
              </tr>
            ))}
            {linhas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                  Nenhum pagamento ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
