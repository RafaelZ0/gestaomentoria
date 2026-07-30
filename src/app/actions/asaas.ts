"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ASAAS_BASE_URL = "https://api.asaas.com/v3";
// Mesmos status que o webhook trata como "pagamento confirmado de verdade".
const STATUS_PAGOS = ["CONFIRMED", "RECEIVED"];

type AsaasPayment = {
  id: string;
  value: number;
  interestValue?: number;
  paymentDate?: string | null;
  clientPaymentDate?: string | null;
};

async function buscarPagamentosAsaas(
  customerId: string,
  apiKey: string
): Promise<AsaasPayment[]> {
  const encontrados = new Map<string, AsaasPayment>();

  for (const status of STATUS_PAGOS) {
    let offset = 0;
    while (true) {
      const url = `${ASAAS_BASE_URL}/payments?customer=${encodeURIComponent(customerId)}&status=${status}&limit=100&offset=${offset}`;
      const res = await fetch(url, {
        headers: { access_token: apiKey },
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Erro ao consultar o Asaas (status ${res.status}).`);
      }
      const json = (await res.json()) as {
        data?: AsaasPayment[];
        hasMore?: boolean;
      };
      for (const p of json.data ?? []) {
        encontrados.set(p.id, p);
      }
      if (!json.hasMore) break;
      offset += 100;
    }
  }

  return [...encontrados.values()];
}

export async function importarHistoricoAsaas(grupoId: string) {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    throw new Error("ASAAS_API_KEY não configurada no servidor.");
  }

  const supabase = await createClient();

  const { data: grupo } = await supabase
    .from("grupos_gestao")
    .select("asaas_customer_id")
    .eq("id", grupoId)
    .single();

  if (!grupo?.asaas_customer_id) {
    throw new Error("Este grupo não tem um ID de cliente Asaas cadastrado.");
  }

  const pagamentosAsaas = await buscarPagamentosAsaas(
    grupo.asaas_customer_id,
    apiKey
  );

  const { data: existentes } = await supabase
    .from("pagamentos")
    .select("asaas_payment_id")
    .eq("grupo_id", grupoId)
    .not("asaas_payment_id", "is", null);

  const jaImportados = new Set(
    (existentes ?? []).map((p) => p.asaas_payment_id)
  );

  const novos = pagamentosAsaas.filter((p) => !jaImportados.has(p.id));

  if (novos.length > 0) {
    await supabase.from("pagamentos").insert(
      novos.map((p) => ({
        grupo_id: grupoId,
        data:
          p.paymentDate ??
          p.clientPaymentDate ??
          new Date().toISOString().slice(0, 10),
        valor: Number(p.value ?? 0) + Number(p.interestValue ?? 0),
        tipo: "MENSALIDADE" as const,
        observacao: "Importado do histórico Asaas",
        asaas_payment_id: p.id,
      }))
    );
  }

  revalidatePath(`/grupos/${grupoId}/pagamentos`);
  revalidatePath("/grupos");

  return { importados: novos.length, totalEncontrados: pagamentosAsaas.length };
}
