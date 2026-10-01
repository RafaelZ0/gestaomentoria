import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatDate } from "@/lib/format";
import { NovoPagamentoForm } from "@/components/NovoPagamentoForm";
import { PagamentoParceladoForm } from "@/components/PagamentoParceladoForm";
import { AsaasCustomerIdField } from "@/components/AsaasCustomerIdField";
import { StatusDot } from "@/components/ui/StatusDot";
import { Metric } from "@/components/ui/Metric";
import { AjudaPopover } from "@/components/ui/PageHeader";
import { getGrupo } from "@/lib/data/grupo";
import { CobrarWhatsApp } from "@/components/CobrarWhatsApp";
import type { MentoradoContato } from "@/lib/avisos";

const TIPO_LABEL: Record<string, string> = {
  MENSALIDADE: "Mensalidade",
  CLAUSULA_CANCELAMENTO: "Cláusula de cancelamento",
};

type Linha = {
  id: string;
  data: string;
  tipoLabel: string;
  valor: number;
  observacao: string | null;
  viaAsaas: boolean;
  atrasado: boolean;
  pago: boolean;
};

export default async function PagamentosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [grupo, { data: pagamentos }, { data: mentorados }] = await Promise.all([
    getGrupo(id),
    supabase
      .from("pagamentos")
      .select("*")
      .eq("grupo_id", id)
      .order("data", { ascending: false }),
    supabase.from("mentorados").select("nome, telefone").eq("grupo_id", id).order("nome"),
  ]);

  const hojeISO = new Date().toISOString().slice(0, 10);

  const linhas: Linha[] = (pagamentos ?? []).map((p) => ({
    id: p.id,
    data: p.data,
    tipoLabel: TIPO_LABEL[p.tipo] ?? p.tipo,
    valor: Number(p.valor),
    observacao: p.observacao,
    viaAsaas: !!p.asaas_payment_id,
    atrasado: p.status === "PENDENTE" && p.data < hojeISO,
    pago: p.status === "PAGO",
  }));

  const totalRecebido = linhas.filter((l) => l.pago).reduce((acc, l) => acc + l.valor, 0);
  const totalEmAtraso = linhas.filter((l) => l.atrasado).reduce((acc, l) => acc + l.valor, 0);

  // Ordem de urgência: atrasados (do mais antigo), o próximo vencimento,
  // o histórico de pagos (mais recente primeiro) e, recolhidos, os demais
  // boletos futuros.
  const atrasados = linhas.filter((l) => l.atrasado).sort((a, b) => a.data.localeCompare(b.data));
  const futuros = linhas
    .filter((l) => !l.pago && !l.atrasado)
    .sort((a, b) => a.data.localeCompare(b.data));
  const proximo = futuros[0] ?? null;
  const demaisFuturos = futuros.slice(1);
  const pagos = linhas.filter((l) => l.pago).sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
        <div className="flex flex-wrap gap-x-12 gap-y-4">
          <Metric rotulo="Total recebido">{formatBRL(totalRecebido)}</Metric>
          {totalEmAtraso > 0 && (
            <Metric rotulo="Em atraso" tom="danger">
              {formatBRL(totalEmAtraso)}
            </Metric>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AjudaPopover>
            <p>
              Todo pagamento é lançado manualmente aqui, ou entra sozinho via integração com o
              Asaas — boletos ainda não pagos aparecem como Pendente/Atrasado e não contam no
              total recebido.
            </p>
          </AjudaPopover>
          <PagamentoParceladoForm grupoId={id} />
          <NovoPagamentoForm grupoId={id} valorSugerido={Number(grupo?.valor_mensal ?? 0)} />
        </div>
      </div>

      {linhas.length === 0 && (
        <p className="py-4 text-sm text-muted">Nenhum pagamento registrado ainda.</p>
      )}

      {atrasados.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[15px] font-semibold text-danger">
            Atrasados · {formatBRL(totalEmAtraso)}
          </h2>
          <Tabela itens={atrasados} cobrar mentorados={mentorados ?? []} />
        </section>
      )}

      {proximo && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[15px] font-semibold text-text">Próximo vencimento</h2>
          <Tabela itens={[proximo]} mentorados={[]} />
        </section>
      )}

      {pagos.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[15px] font-semibold text-text">Histórico</h2>
          <Tabela itens={pagos} mentorados={[]} />
        </section>
      )}

      {demaisFuturos.length > 0 && (
        <details className="group flex flex-col gap-2">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-[15px] font-semibold text-text">
            <span className="inline-block text-subtle transition-transform group-open:rotate-90">▸</span>
            Próximos boletos ({demaisFuturos.length})
          </summary>
          <div className="mt-2">
            <Tabela itens={demaisFuturos} mentorados={[]} />
          </div>
        </details>
      )}

      <AsaasCustomerIdField grupoId={id} asaasCustomerId={grupo?.asaas_customer_id ?? null} />
    </div>
  );
}

function Tabela({
  itens,
  cobrar = false,
  mentorados,
}: {
  itens: Linha[];
  cobrar?: boolean;
  mentorados: MentoradoContato[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-[14.5px]">
        <thead>
          <tr className="border-b border-line text-[13px] text-muted">
            <th className="px-3 pb-2.5 pt-1 font-normal">Vencimento</th>
            <th className="px-3 pb-2.5 pt-1 font-normal">Tipo</th>
            <th className="px-3 pb-2.5 pt-1 font-normal">Status</th>
            <th className="px-3 pb-2.5 pt-1 text-right font-normal">Valor</th>
            <th className="px-3 pb-2.5 pt-1 font-normal">Observação</th>
            {cobrar && <th className="px-3 pb-2.5 pt-1" />}
          </tr>
        </thead>
        <tbody>
          {itens.map((l) => (
            <tr key={l.id} className="border-b border-line-soft last:border-0">
              <td className="px-3 py-3 tabular-nums text-text">{formatDate(l.data)}</td>
              <td className="px-3 py-3 text-text-2">
                {l.tipoLabel}
                {l.viaAsaas && <span className="ml-2 text-[12px] text-subtle">via Asaas</span>}
              </td>
              <td className="px-3 py-3 text-[13.5px]">
                {l.pago ? (
                  <StatusDot tom="ok">Pago</StatusDot>
                ) : l.atrasado ? (
                  <StatusDot tom="danger">Atrasado</StatusDot>
                ) : (
                  <StatusDot tom="off">Pendente</StatusDot>
                )}
              </td>
              <td className={`px-3 py-3 text-right tabular-nums ${l.atrasado ? "text-danger" : "text-text"}`}>
                {formatBRL(l.valor)}
              </td>
              <td className="px-3 py-3 text-[13.5px] text-muted">{l.observacao ?? "—"}</td>
              {cobrar && (
                <td className="px-3 py-3 text-right">
                  <CobrarWhatsApp mentorados={mentorados} valor={l.valor} vencimento={l.data} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
