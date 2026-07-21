export type StatusGrupo = "Ativo" | "Inativo";
export type TrafegoPago = "SIM" | "NÃO" | "PARADO" | "EM IMPLEMENTAÇÃO";
export type TipoPagamento = "MENSALIDADE" | "CLAUSULA_CANCELAMENTO";

export type GrupoGestao = {
  id: string;
  nome: string;
  data_inicio: string;
  status: StatusGrupo;
  data_termino: string | null;
  trafego_pago: TrafegoPago | null;
  valor_mensal: number;
  valor_investido_dia: number | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type Mentorado = {
  id: string;
  grupo_id: string;
  nome: string;
  telefone: string | null;
};

export type TipoEntrega = {
  id: string;
  nome: string;
  ativo: boolean;
};

export type Reuniao = {
  id: string;
  grupo_id: string;
  data: string;
  resumo: string;
  created_at: string;
};

export type EntregaGrupo = {
  id: string;
  grupo_id: string;
  tipo_entrega_id: string;
  feito: boolean;
  data_feito: string | null;
  reuniao_id: string | null;
};

export type Pagamento = {
  id: string;
  grupo_id: string;
  data: string;
  valor: number;
  tipo: TipoPagamento;
  observacao: string | null;
  created_at: string;
};

export type Tarefa = {
  id: string;
  grupo_id: string;
  descricao: string;
  concluida: boolean;
  created_at: string;
};

export type CustoFixo = {
  id: string;
  nome: string;
  valor: number;
  ordem: number | null;
  updated_at: string;
};

export type CustoHoraConfig = {
  id: number;
  percentual_fator_avaliacao: number;
};

export type TipoLancamento = "RECEITA" | "DESPESA";

export type LancamentoFinanceiro = {
  id: string;
  tipo: TipoLancamento;
  descricao: string;
  categoria: string | null;
  valor: number;
  data: string;
  created_at: string;
};

export type CustoFixoMensalItem = {
  id: string;
  ano: number;
  mes: number;
  nome: string;
  valor: number;
  created_at: string;
};

type Relationships = never[];

export type Database = {
  public: {
    Tables: {
      grupos_gestao: {
        Row: GrupoGestao;
        Insert: Partial<GrupoGestao> &
          Pick<GrupoGestao, "nome" | "data_inicio" | "valor_mensal">;
        Update: Partial<GrupoGestao>;
        Relationships: Relationships;
      };
      mentorados: {
        Row: Mentorado;
        Insert: Partial<Mentorado> & Pick<Mentorado, "nome" | "grupo_id">;
        Update: Partial<Mentorado>;
        Relationships: Relationships;
      };
      tipos_entrega: {
        Row: TipoEntrega;
        Insert: Partial<TipoEntrega> & Pick<TipoEntrega, "nome">;
        Update: Partial<TipoEntrega>;
        Relationships: Relationships;
      };
      reunioes: {
        Row: Reuniao;
        Insert: Partial<Reuniao> & Pick<Reuniao, "grupo_id" | "resumo">;
        Update: Partial<Reuniao>;
        Relationships: Relationships;
      };
      entregas_grupo: {
        Row: EntregaGrupo;
        Insert: Partial<EntregaGrupo> &
          Pick<EntregaGrupo, "grupo_id" | "tipo_entrega_id">;
        Update: Partial<EntregaGrupo>;
        Relationships: Relationships;
      };
      pagamentos: {
        Row: Pagamento;
        Insert: Partial<Pagamento> &
          Pick<Pagamento, "grupo_id" | "data" | "valor">;
        Update: Partial<Pagamento>;
        Relationships: Relationships;
      };
      tarefas: {
        Row: Tarefa;
        Insert: Partial<Tarefa> & Pick<Tarefa, "grupo_id" | "descricao">;
        Update: Partial<Tarefa>;
        Relationships: Relationships;
      };
      custos_fixos: {
        Row: CustoFixo;
        Insert: Partial<CustoFixo> & Pick<CustoFixo, "nome" | "valor">;
        Update: Partial<CustoFixo>;
        Relationships: Relationships;
      };
      custo_hora_config: {
        Row: CustoHoraConfig;
        Insert: Partial<CustoHoraConfig>;
        Update: Partial<CustoHoraConfig>;
        Relationships: Relationships;
      };
      lancamentos_financeiros: {
        Row: LancamentoFinanceiro;
        Insert: Partial<LancamentoFinanceiro> &
          Pick<LancamentoFinanceiro, "tipo" | "descricao" | "valor">;
        Update: Partial<LancamentoFinanceiro>;
        Relationships: Relationships;
      };
      custos_fixos_mensais_itens: {
        Row: CustoFixoMensalItem;
        Insert: Partial<CustoFixoMensalItem> &
          Pick<CustoFixoMensalItem, "ano" | "mes" | "nome" | "valor">;
        Update: Partial<CustoFixoMensalItem>;
        Relationships: Relationships;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
