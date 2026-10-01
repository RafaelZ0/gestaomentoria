import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatDate, plural } from "@/lib/format";
import { getAvisos } from "@/lib/data/avisos";
import { CobrarWhatsApp } from "@/components/CobrarWhatsApp";
import { calcTabelaMensal } from "@/lib/finance";
import { TabelaMensalFinancas } from "@/components/TabelaMensalFinancas";
import { PageHeader } from "@/components/ui/PageHeader";
import { Metric } from "@/components/ui/Metric";

export default async function FinancasPage() {
  const supabase = await createClient();

  const [
    avisos,
    { data: pagamentos },
    { data: grupos },
    { data: custosFixos },
    { data: lancamentos },
    { data: custosFixosMensaisItens },
  ] = await Promise.all([
    getAvisos(),
    supabase.from("pagamentos").select("*"),
    supabase.from("grupos_gestao").select("*"),
    supabase.from("custos_fixos").select("*"),
    supabase
      .from("lancamentos_financeiros")
      .select("*")
      .order("data", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("custos_fixos_mensais_itens")
      .select("*")
      .order("created_at", { ascending: true }),
  ]);

  const custosFixosMensais = (custosFixos ?? []).reduce(
    (acc, c) => acc + Number(c.valor),
    0
  );

  const itensCustosFixosMensaisMap = new Map<
    string,
    { id: string; nome: string; valor: number }[]
  >();
  for (const item of custosFixosMensaisItens ?? []) {
    const chave = `${item.ano}-${item.mes}`;
    const lista = itensCustosFixosMensaisMap.get(chave) ?? [];
    lista.push({ id: item.id, nome: item.nome, valor: Number(item.valor) });
    itensCustosFixosMensaisMap.set(chave, lista);
  }

  const tabelaMensal = calcTabelaMensal(
    grupos ?? [],
    pagamentos ?? [],
    lancamentos ?? [],
    custosFixosMensais,
    itensCustosFixosMensaisMap
  );

  const entradaTotal = tabelaMensal.reduce((acc, m) => acc + m.entrada, 0);
  const faturamentoTotal = tabelaMensal.reduce((acc, m) => acc + m.faturamento, 0);
  const gastoTotal = tabelaMensal.reduce((acc, m) => acc + m.gasto, 0);
  const lucroAcumulado = entradaTotal - gastoTotal;

  const valorClausulas = (pagamentos ?? [])
    .filter((p) => p.tipo === "CLAUSULA_CANCELAMENTO" && p.status === "PAGO")
    .reduce((acc, p) => acc + Number(p.valor), 0);

  const gruposCancelados = (grupos ?? []).filter(
    (g) => g.status === "Inativo"
  ).length;

  const hojeISO = new Date().toISOString().slice(0, 10);
  const emAtrasoTotal = (pagamentos ?? [])
    .filter((p) => p.status === "PENDENTE" && p.data < hojeISO)
    .reduce((acc, p) => acc + Number(p.valor), 0);

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-9">
      <PageHeader
        titulo="Finanças"
        ajuda={
          <>
            <p>
              Visão consolidada da consultoria: entrada de caixa real (pagamentos
              registrados) comparada ao faturamento vendido, mais custos e despesas, mês a
              mês.
            </p>
            <p>
              <span className="text-text">Entrada</span> = pagamentos de verdade registrados no
              mês (lançados à mão ou vindos do Asaas) + cláusulas recebidas + receitas avulsas.
            </p>
            <p>
              <span className="text-text">Faturamento</span> = valor total vendido (valor mensal
              × 12) dos grupos fechados naquele mês — não é dinheiro em caixa, é quanto foi
              vendido.
            </p>
            <p>
              <span className="text-text">Gasto</span> = custos fixos do mês (por padrão, o valor
              atual de {formatBRL(custosFixosMensais)} — substituível por itens lançados à mão
              naquele mês) + despesas avulsas lançadas no mês.
            </p>
            <p>
              Clique em um mês para ver a composição, editar e lançar receitas/despesas avulsas
              daquele mês.
            </p>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-x-10 gap-y-7 border-b border-line pb-8 lg:grid-cols-4">
        <Metric rotulo="Lucro acumulado" tom={lucroAcumulado < 0 ? "danger" : undefined}>
          {formatBRL(lucroAcumulado)}
          <Dica>Entrada total − gasto total, somando todos os meses</Dica>
        </Metric>
        <Metric rotulo="Entrada total">{formatBRL(entradaTotal)}</Metric>
        <Metric rotulo="Faturamento vendido">
          {formatBRL(faturamentoTotal)}
          <Dica>Valor total dos acompanhamentos fechados</Dica>
        </Metric>
        <Metric rotulo="Gasto total">{formatBRL(gastoTotal)}</Metric>
        <Metric rotulo="Em atraso" tom={emAtrasoTotal > 0 ? "danger" : undefined}>
          {formatBRL(emAtrasoTotal)}
          <Dica>Boletos vencidos importados do Asaas, ainda não pagos</Dica>
        </Metric>
        <Metric rotulo="Custos fixos mensais">
          {formatBRL(custosFixosMensais)}
          <Link href="/custo-hora" prefetch={false} className="link mt-1 block text-[12.5px] font-normal tracking-normal">
            Editar custo por grupo
          </Link>
        </Metric>
        <Metric rotulo="Grupos cancelados">
          {gruposCancelados}
          <Dica>{formatBRL(valorClausulas)} em cláusulas</Dica>
        </Metric>
      </div>

      {avisos.pagamento.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[15px] font-semibold text-danger">
            Em atraso · {plural(avisos.pagamento.length, "boleto", "boletos")}
          </h2>
          <div className="flex flex-col">
            {avisos.pagamento.map((p) => (
              <div
                key={p.pagamentoId}
                className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line-soft py-2 text-[14.5px] last:border-b-0"
              >
                <Link href={`/grupos/${p.grupoId}/pagamentos`} prefetch={false} className="text-text hover:text-gold">
                  {p.grupoNome}
                </Link>
                <span className="flex items-center gap-5">
                  <span className="text-[13.5px] tabular-nums text-muted">
                    venceu {formatDate(p.vencimento)}
                  </span>
                  <span className="tabular-nums text-danger">{formatBRL(p.valor)}</span>
                  <CobrarWhatsApp mentorados={p.mentorados} valor={p.valor} vencimento={p.vencimento} />
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-[15px] font-semibold text-text">Por mês</h2>
        <TabelaMensalFinancas
          meses={tabelaMensal}
          lancamentos={lancamentos ?? []}
          custosFixosAtual={custosFixosMensais}
        />
      </section>
    </div>
  );
}

function Dica({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-1 block text-[12.5px] font-normal tracking-normal text-subtle">
      {children}
    </span>
  );
}
