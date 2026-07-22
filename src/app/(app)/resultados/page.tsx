import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge, statusGrupoVariant } from "@/components/StatusBadge";

export default async function ResultadosPage() {
  const supabase = await createClient();

  const { data: grupos } = await supabase
    .from("grupos_gestao")
    .select("id, nome, status")
    .order("status", { ascending: true })
    .order("nome", { ascending: true });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
        Resultados
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Investimento, leads, vendas e faturamento de tráfego pago são
        controlados por grupo. Escolha um grupo para ver o total e o
        detalhamento por mês.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary">
              <th className="px-4 py-3 font-medium">Grupo</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(grupos ?? []).map((g) => (
              <tr
                key={g.id}
                className="border-b border-border last:border-0 hover:bg-bg-surface-hover"
              >
                <td className="px-4 py-3 font-medium text-text-primary">
                  <Link
                    href={`/grupos/${g.id}/resultados`}
                    className="hover:text-accent"
                  >
                    {g.nome}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge label={g.status} variant={statusGrupoVariant(g.status)} />
                </td>
                <td className="px-4 py-3 text-right text-text-secondary">→</td>
              </tr>
            ))}
            {(grupos ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-text-secondary">
                  Nenhum grupo cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
