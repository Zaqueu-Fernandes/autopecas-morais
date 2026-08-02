/**
 * ============================================================================
 * TIPOS E VALIDAÇÃO — FINANCEIRO
 * ============================================================================
 * Espelha a tabela financeiro (ver financeiro.sql). `pago` = quitado
 * (recebido, no caso de tipo='receber'; pago, no caso de tipo='pagar').
 */

export type TipoFinanceiro = 'pagar' | 'receber';

/**
 * Guarda a `chave` de uma linha de categorias_despesa (feature
 * @/features/categorias, cadastrável em Cadastros > Categorias) — texto
 * simples, não FK de verdade (ver categorias_despesa.sql). 'fornecedor' e
 * 'retirada_lucro' são chaves protegidas com comportamento especial no
 * código (fornecedor pede fornecedorId; retirada_lucro nunca entra no
 * cálculo de lucro — REGRA DE OURO, ver financeiro.sql) — estáveis mesmo
 * que o usuário renomeie o rótulo exibido dessas categorias.
 */
export type CategoriaPagar = string;

export type CategoriaReceber = 'servico_os' | 'venda_balcao' | 'estorno' | 'receita_avulsa';

/** Espelha despesas/types.ts Periodicidade — duplicado de propósito (ver nota lá). */
export type Periodicidade = 'semanal' | 'mensal' | 'anual';

export const ROTULO_CATEGORIA_RECEBER: Record<CategoriaReceber, string> = {
  servico_os: 'Serviço (OS)',
  venda_balcao: 'Venda de balcão',
  estorno: 'Estorno / Reembolso',
  receita_avulsa: 'Receita Avulsa',
};

export type FormaPagamento =
  | 'dinheiro'
  | 'pix'
  | 'cartao_debito'
  | 'cartao_credito'
  | 'boleto'
  | 'transferencia';

export const ROTULO_FORMA_PAGAMENTO: Record<FormaPagamento, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  cartao_debito: 'Cartão de débito',
  cartao_credito: 'Cartão de crédito',
  boleto: 'Boleto',
  transferencia: 'Transferência',
};

export interface LancamentoFinanceiro {
  id?: string;
  /**
   * A qual empresa (CNPJ) este lançamento pertence — separa o faturamento
   * entre empresas. Só fica null enquanto PENDENTE e gerado de uma despesa
   * recorrente (que não tem mais empresa própria, ver despesas/types.ts) —
   * a UI mostra "Empresa a Definir" nesse caso, e Quitar passa a exigir a
   * empresa real antes de confirmar. Todo outro jeito de lançar (conta a
   * pagar manual, faturar OS, finalizar venda) já exige empresa na criação.
   */
  empresaId: string | null;
  tipo: TipoFinanceiro;
  categoria: CategoriaPagar | CategoriaReceber;
  descricao: string;
  valor: number;
  pago: boolean;
  formaPagamento: FormaPagamento | null;
  /** Qual conta (banco/carteira/cartão/investimento — @/features/contas-financeiras)
   * recebeu/pagou. Preenchida no mesmo momento que formaPagamento (quitação,
   * faturamento à vista, venda à vista, estorno) — null enquanto pendente. */
  contaFinanceiraId: string | null;
  dataPagamento: string | null;
  vencimento: string | null; // yyyy-mm-dd
  clienteId: string | null;
  fornecedorId: string | null;
  /**
   * "Pra quem" a despesa/receita é paga quando a categoria NÃO é 'fornecedor'
   * (@/features/cadastros — Credor). Opcional: só o lançamento manual
   * (Nova conta a pagar) de fato coleta isso do usuário — os demais pontos
   * que criam LancamentoFinanceiro (faturar OS, finalizar venda, estorno,
   * devolução) não têm um credor pra atribuir, então nem preenchem o campo.
   */
  credorId?: string | null;
  osId: string | null;
  vendaId: string | null;
  despesaFixaId: string | null;
  /** Só preenchido em lançamentos gerados de uma despesa recorrente — manual fica null. */
  periodicidade: Periodicidade | null;
  /**
   * true = este lançamento foi cancelado depois (ver estornarLancamento) —
   * não conta mais em faturamento/pendências. Opcional na criação (igual
   * `id`/`createdAt`) — o banco assume false; só existe de verdade depois
   * de estornar.
   */
  estornado?: boolean;
  estornadoEm?: string | null;
  estornadoMotivo?: string | null;
  /** Preenchido só no lançamento de CONTRAPARTIDA — aponta pro original que ele reverte. */
  estornoDeId?: string | null;
  observacoes: string;
  createdAt?: string;
}

export type ErrosValidacao = Record<string, string>;
export const semErros = (e: ErrosValidacao) => Object.keys(e).length === 0;

// ---- Conta a pagar (lançamento manual) --------------------------------------

export interface DadosContaPagar {
  categoria: CategoriaPagar;
  descricao: string;
  valor: string;
  fornecedorId: string;
  /** Só relevante quando categoria !== 'fornecedor' — ver Credor em @/features/cadastros. Opcional. */
  credorId: string;
  vencimento: string;
  observacoes: string;
}

export const dadosContaPagarVazio = (): DadosContaPagar => ({
  categoria: 'despesa_geral',
  descricao: '',
  valor: '',
  fornecedorId: '',
  credorId: '',
  vencimento: '',
  observacoes: '',
});

/**
 * Empresa NÃO é pedida aqui — a conta a pagar nasce com `empresaId: null`
 * (mesma situação de "Empresa a Definir" que já existia pra despesa
 * recorrente) e só é exigida no momento de Quitar (ver DadosQuitacao/
 * FormQuitacao), quando o dinheiro sai de verdade.
 */
export function validarContaPagar(d: DadosContaPagar): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (!d.categoria) erros.categoria = 'Selecione a categoria.';
  if (!d.descricao.trim()) erros.descricao = 'Descreva a conta.';
  const valor = Number(d.valor);
  if (!d.valor.trim() || Number.isNaN(valor) || valor <= 0)
    erros.valor = 'Informe um valor maior que zero.';
  if (!d.vencimento) erros.vencimento = 'Informe o vencimento.';
  if (d.categoria === 'fornecedor' && !d.fornecedorId)
    erros.fornecedorId = 'Selecione o fornecedor.';
  return erros;
}

// ---- Conta a receber (lançamento manual — sempre categoria 'receita_avulsa') --

/**
 * Cobre receita que NÃO vem de faturar OS nem finalizar venda de balcão —
 * ex.: reembolso de terceiro, serviço avulso cobrado fora do fluxo normal.
 * Categoria fixa 'receita_avulsa' (não é escolha do usuário, diferente de
 * DadosContaPagar): servico_os/venda_balcao continuam só nascendo do
 * faturamento automático, nunca digitadas manualmente.
 */
export interface DadosContaReceber {
  descricao: string;
  valor: string;
  /** Opcional — mesma regra de Venda de Balcão (cliente só é obrigatório pra fechar a prazo/fiado, aqui nem isso). */
  clienteId: string;
  vencimento: string;
  observacoes: string;
}

export const dadosContaReceberVazio = (): DadosContaReceber => ({
  descricao: '',
  valor: '',
  clienteId: '',
  vencimento: '',
  observacoes: '',
});

/**
 * Empresa NÃO é pedida aqui — mesma lógica de DadosContaPagar: nasce com
 * `empresaId: null` ("Empresa a Definir") e só é exigida no momento de
 * Quitar (ver DadosQuitacao/FormQuitacao), quando o dinheiro entra de verdade.
 */
export function validarContaReceber(d: DadosContaReceber): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (!d.descricao.trim()) erros.descricao = 'Descreva a receita.';
  const valor = Number(d.valor);
  if (!d.valor.trim() || Number.isNaN(valor) || valor <= 0)
    erros.valor = 'Informe um valor maior que zero.';
  if (!d.vencimento) erros.vencimento = 'Informe o vencimento.';
  return erros;
}

// ---- Quitação (marcar como pago/recebido) -----------------------------------

export interface DadosQuitacao {
  formaPagamento: FormaPagamento | '';
  contaFinanceiraId: string;
  /** Data em que o pagamento/recebimento aconteceu de verdade — editável (não trava em "hoje"), pra dar pra quitar retroativamente. */
  dataPagamento: string; // yyyy-mm-dd
  /** Só relevante/validado quando `precisaEmpresa` (lançamento ainda sem empresa definida). */
  empresaId: string;
}

export const dadosQuitacaoVazio = (): DadosQuitacao => ({
  formaPagamento: '',
  contaFinanceiraId: '',
  dataPagamento: new Date().toISOString().slice(0, 10),
  empresaId: '',
});

/** `precisaEmpresa` = o lançamento ainda não tem empresa (veio de despesa recorrente global ou de conta a pagar manual — ver DadosContaPagar). */
export function validarQuitacao(d: DadosQuitacao, precisaEmpresa: boolean): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (!d.formaPagamento) erros.formaPagamento = 'Selecione a forma de pagamento.';
  // Dinheiro não passa por banco/cartão, não tem o que rastrear — mesma
  // exceção já aplicada em Faturar OS/Finalizar venda (ver validarFaturamento).
  if (d.formaPagamento !== 'dinheiro' && !d.contaFinanceiraId) erros.contaFinanceiraId = 'Selecione a conta.';
  if (!d.dataPagamento) erros.dataPagamento = 'Informe a data do pagamento.';
  if (precisaEmpresa && !d.empresaId) erros.empresaId = 'Selecione a empresa que pagou/recebeu.';
  return erros;
}

// ---- Faturamento de OS (3 situações de recebimento) -------------------------

export type SituacaoRecebimento = 'a_vista' | 'a_prazo' | 'fiado';

export const ROTULO_SITUACAO: Record<SituacaoRecebimento, string> = {
  a_vista: 'À vista',
  a_prazo: 'A prazo',
  fiado: 'Em aberto (fiado)',
};

export interface DadosFaturamento {
  empresaId: string;
  situacao: SituacaoRecebimento;
  formaPagamento: FormaPagamento | '';
  /** Só exigida quando situacao='a_vista' — é aí que o dinheiro já entra de verdade. */
  contaFinanceiraId: string;
  vencimento: string; // yyyy-mm-dd, só usado em a_prazo
}

export const dadosFaturamentoVazio = (): DadosFaturamento => ({
  empresaId: '',
  situacao: 'a_vista',
  formaPagamento: '',
  contaFinanceiraId: '',
  vencimento: '',
});

export function validarFaturamento(d: DadosFaturamento): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (!d.empresaId) erros.empresaId = 'Selecione a empresa.';
  if (d.situacao === 'a_vista' && !d.formaPagamento)
    erros.formaPagamento = 'Selecione a forma de pagamento.';
  // Pagamento em dinheiro não pede conta — não tem o que rastrear (não passa
  // por banco/cartão). Nos demais, a conta é obrigatória.
  if (d.situacao === 'a_vista' && d.formaPagamento !== 'dinheiro' && !d.contaFinanceiraId)
    erros.contaFinanceiraId = 'Selecione a conta.';
  if (d.situacao === 'a_prazo' && !d.vencimento)
    erros.vencimento = 'Informe o vencimento.';
  return erros;
}

// ---- Estorno (cancela um lançamento já quitado ou vinculado a OS/venda) -----

export interface DadosEstorno {
  motivo: string;
  /** Só pedidos quando o original já estava pago/recebido — viram forma/conta da contrapartida. */
  formaPagamento: FormaPagamento | '';
  contaFinanceiraId: string;
}

export const dadosEstornoVazio = (): DadosEstorno => ({ motivo: '', formaPagamento: '', contaFinanceiraId: '' });

/** `precisaFormaPagamento` = o lançamento original já estava quitado (vai gerar contrapartida). */
export function validarEstorno(d: DadosEstorno, precisaFormaPagamento: boolean): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (!d.motivo.trim()) erros.motivo = 'Explique o motivo do estorno.';
  if (precisaFormaPagamento && !d.formaPagamento)
    erros.formaPagamento = 'Selecione como o dinheiro está sendo devolvido.';
  if (precisaFormaPagamento && !d.contaFinanceiraId)
    erros.contaFinanceiraId = 'Selecione a conta.';
  return erros;
}
