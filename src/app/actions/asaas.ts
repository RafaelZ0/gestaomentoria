"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { StatusPagamento } from "@/lib/database.types";

const ASAAS_BASE_URL = "https://api.asaas.com/v3";

// Status do Asaas -> status interno. CONFIRMED/RECEIVED = dinheiro já
// entrou. PENDING/OVERDUE = boleto em aberto (a vencer ou já vencido) —
// importado só pra dar visibilidade de inadimplência, não conta como
// Entrada até virar PAGO de verdade.
const STATUS_MAP: Record<string, StatusPagamento> = {
  CONFIRMED: "PAGO",
  RECEIVED: "PAGO",
  PENDING: "PENDENTE",
  OVERDUE: "PENDENTE",
};

type AsaasPayment = {
  id: string;
  value: number;
  interestValue?: number;
  paymentDate?: string | null;
  clientPaymentDate?: string | null;
  dueDate?: string | null;
};

type Resultado<T> = ({ ok: true } & T) | { ok: false; error: string };

async function buscarPagamentosAsaas(
  customerId: string,
  apiKey: string
): Promise<(AsaasPayment & { statusAsaas: string })[]> {
  const encontrados = new Map<string, AsaasPayment & { statusAsaas: string }>();

  for (const status of Object.keys(STATUS_MAP)) {
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
        encontrados.set(p.id, { ...p, statusAsaas: status });
      }
      if (!json.hasMore) break;
      offset += 100;
    }
  }

  return [...encontrados.values()];
}

export async function buscarClienteAsaasPorDocumento(
  cpfCnpj: string
): Promise<Resultado<{ id: string; name: string }>> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "ASAAS_API_KEY não configurada no servidor." };
  }

  const documento = cpfCnpj.replace(/\D/g, "");
  if (!documento) {
    return { ok: false, error: "Informe um CPF ou CNPJ." };
  }

  try {
    const res = await fetch(
      `${ASAAS_BASE_URL}/customers?cpfCnpj=${encodeURIComponent(documento)}`,
      { headers: { access_token: apiKey }, cache: "no-store" }
    );
    if (!res.ok) {
      return {
        ok: false,
        error: `Erro ao consultar o Asaas (status ${res.status}).`,
      };
    }

    const json = (await res.json()) as {
      data?: { id: string; name: string }[];
    };

    const cliente = json.data?.[0];
    if (!cliente) {
      return {
        ok: false,
        error: "Nenhum cliente encontrado no Asaas com esse CPF/CNPJ.",
      };
    }

    return { ok: true, id: cliente.id, name: cliente.name };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao buscar cliente no Asaas.",
    };
  }
}

export async function importarHistoricoAsaas(
  grupoId: string
): Promise<Resultado<{ importados: number; atualizados: number; totalEncontrados: number }>> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "ASAAS_API_KEY não configurada no servidor." };
  }

  const supabase = await createClient();

  const { data: grupo } = await supabase
    .from("grupos_gestao")
    .select("asaas_customer_id")
    .eq("id", grupoId)
    .single();

  if (!grupo?.asaas_customer_id) {
    return {
      ok: false,
      error: "Este grupo não tem um ID de cliente Asaas cadastrado.",
    };
  }

  try {
    const pagamentosAsaas = await buscarPagamentosAsaas(
      grupo.asaas_customer_id,
      apiKey
    );

    const { data: existentes } = await supabase
      .from("pagamentos")
      .select("id, asaas_payment_id, status")
      .eq("grupo_id", grupoId)
      .not("asaas_payment_id", "is", null);

    const existentesPorId = new Map(
      (existentes ?? []).map((p) => [p.asaas_payment_id as string, p])
    );

    const novos: {
      grupo_id: string;
      data: string;
      valor: number;
      tipo: "MENSALIDADE";
      status: StatusPagamento;
      observacao: string;
      asaas_payment_id: string;
    }[] = [];
    const atualizacoes: { id: string; status: StatusPagamento; valor: number; data: string }[] = [];

    for (const p of pagamentosAsaas) {
      const statusNovo = STATUS_MAP[p.statusAsaas] ?? "PENDENTE";
      const valor = Number(p.value ?? 0) + Number(p.interestValue ?? 0);
      const data =
        p.paymentDate ??
        p.clientPaymentDate ??
        p.dueDate ??
        new Date().toISOString().slice(0, 10);

      const existente = existentesPorId.get(p.id);
      if (!existente) {
        novos.push({
          grupo_id: grupoId,
          data,
          valor,
          tipo: "MENSALIDADE",
          status: statusNovo,
          observacao:
            statusNovo === "PAGO"
              ? "Importado do histórico Asaas"
              : "Boleto em aberto (Asaas)",
          asaas_payment_id: p.id,
        });
      } else if (existente.status !== statusNovo) {
        atualizacoes.push({ id: existente.id, status: statusNovo, valor, data });
      }
    }

    if (novos.length > 0) {
      await supabase.from("pagamentos").insert(novos);
    }
    for (const u of atualizacoes) {
      await supabase
        .from("pagamentos")
        .update({ status: u.status, valor: u.valor, data: u.data })
        .eq("id", u.id);
    }

    revalidatePath(`/grupos/${grupoId}/pagamentos`);
    revalidatePath("/grupos");
    revalidatePath("/financas");

    return {
      ok: true,
      importados: novos.length,
      atualizados: atualizacoes.length,
      totalEncontrados: pagamentosAsaas.length,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao importar histórico do Asaas.",
    };
  }
}
