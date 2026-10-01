import { formatBRL, formatMesAno } from "@/lib/format";
import { num, type OnboardingPrecisao, type OnboardingValores } from "@/lib/onboarding";

type Ultimo = {
  mes: string;
  leads: number;
  vendas: number;
  faturamento: number;
};

// "Linha de base × hoje": números do raio-X ao lado do mês mais recente
// com lançamento de resultado. Só os números lado a lado, sem conclusões.
export function LinhaDeBase({
  respostas,
  precisao,
  ultimo,
}: {
  respostas: OnboardingValores;
  precisao: OnboardingPrecisao;
  ultimo: Ultimo;
}) {
  function base(k: string, dinheiro = false) {
    if (precisao[k] === "naosei") return <span className="text-muted">sem linha de base</span>;
    const v = num(respostas[k]);
    if (v === null) return <span className="text-muted">não informado</span>;
    return (
      <>
        {dinheiro ? formatBRL(v) : v.toLocaleString("pt-BR")}
        {precisao[k] === "aprox" && <span className="ml-1.5 text-[12.5px] text-muted">aprox.</span>}
      </>
    );
  }

  const [ano, mes] = ultimo.mes.split("-").map(Number);

  const linhas: { rotulo: string; antes: React.ReactNode; hoje: React.ReactNode }[] = [
    { rotulo: "Contatos / leads por mês", antes: base("contatos"), hoje: ultimo.leads.toLocaleString("pt-BR") },
    {
      rotulo: "Agendamentos por mês",
      antes: base("agendados"),
      hoje: <span className="text-muted">não registrado nos lançamentos</span>,
    },
    { rotulo: "Fechamentos por mês", antes: base("fecharam"), hoje: ultimo.vendas.toLocaleString("pt-BR") },
    { rotulo: "Faturamento por mês", antes: base("fat", true), hoje: formatBRL(ultimo.faturamento) },
  ];

  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-6">
      <h2 className="text-xl font-semibold text-text">Linha de base × hoje</h2>
      <p className="text-sm text-muted">
        Números informados no diagnóstico ao lado do último mês com lançamento de resultados (
        {formatMesAno(ano, mes).toLocaleLowerCase("pt-BR")}). No raio-X, o faturamento é o da
        clínica; nos lançamentos, é o das campanhas (interna + tráfego pago).
      </p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-base">
          <thead>
            <tr className="border-b border-line text-[13px] text-muted">
              <th className="py-2.5 pr-4 font-normal" />
              <th className="py-2.5 pr-4 font-normal">Raio-X (linha de base)</th>
              <th className="py-2.5 font-normal">{formatMesAno(ano, mes)}</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.rotulo} className="border-b border-line-soft last:border-0">
                <td className="py-3 pr-4 text-text-2">{l.rotulo}</td>
                <td className="py-3 pr-4 tabular-nums text-text">{l.antes}</td>
                <td className="py-3 tabular-nums text-text">{l.hoje}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
