import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Eventos do Asaas que significam "o pagamento entrou de verdade" — os
// outros (PAYMENT_CREATED, PAYMENT_OVERDUE, PAYMENT_DELETED etc.) são
// ignorados de propósito, só queremos lançar quando o dinheiro chegou.
const EVENTOS_PAGO = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]);

type AsaasWebhookPayload = {
  event?: string;
  payment?: {
    id?: string;
    customer?: string;
    value?: number;
    interestValue?: number;
    paymentDate?: string | null;
    clientPaymentDate?: string | null;
  };
};

export async function POST(request: Request) {
  // Verifica que a chamada realmente veio do Asaas comparando o token que
  // você configurou no painel deles (Webhooks > Token de autenticação) com
  // essa mesma variável salva aqui.
  const token = request.headers.get("asaas-access-token");
  if (!token || token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: AsaasWebhookPayload;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const evento = body.event;
  const payment = body.payment;

  // Payload sem o formato esperado, ou evento que não nos interessa: não é
  // erro, só não faz nada — devolve 200 pra o Asaas não ficar retentando.
  if (!evento || !payment?.id || !payment.customer) {
    return new Response("OK (payload ignorado)", { status: 200 });
  }
  if (!EVENTOS_PAGO.has(evento)) {
    return new Response("OK (evento ignorado)", { status: 200 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Webhook Asaas: SUPABASE_SERVICE_ROLE_KEY não configurada.");
    return new Response("Server misconfigured", { status: 500 });
  }

  // Cliente com a service role: essa rota não tem sessão de usuário (é o
  // Asaas chamando de fora), então precisa bypassar RLS pra gravar.
  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

  const { data: grupo } = await supabase
    .from("grupos_gestao")
    .select("id")
    .eq("asaas_customer_id", payment.customer)
    .maybeSingle();

  if (!grupo) {
    console.warn(
      `Webhook Asaas: cliente ${payment.customer} não está vinculado a nenhum grupo.`
    );
    return new Response("OK (sem grupo vinculado)", { status: 200 });
  }

  // Idempotência: o Asaas pode reenviar o mesmo evento, ou disparar mais de
  // um evento pro mesmo pagamento (ex: CONFIRMED e depois RECEIVED).
  const { data: existente } = await supabase
    .from("pagamentos")
    .select("id")
    .eq("asaas_payment_id", payment.id)
    .maybeSingle();

  if (existente) {
    return new Response("OK (já registrado)", { status: 200 });
  }

  // Juros/multa somados ao valor original, tudo num lançamento só.
  const valorTotal = Number(payment.value ?? 0) + Number(payment.interestValue ?? 0);
  const data =
    payment.paymentDate ??
    payment.clientPaymentDate ??
    new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("pagamentos").insert({
    grupo_id: grupo.id,
    data,
    valor: valorTotal,
    tipo: "MENSALIDADE",
    observacao: `Pago via Asaas (${evento})`,
    asaas_payment_id: payment.id,
  });

  if (error) {
    console.error("Webhook Asaas: erro ao lançar pagamento.", error);
    return new Response("Erro ao lançar pagamento", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
