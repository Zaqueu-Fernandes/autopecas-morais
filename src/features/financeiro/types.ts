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

export type CategoriaReceber = 'servico_os' | 'venda_balcao' | 'estorno';

/** Espelha despesas/types.ts Periodicidade — duplicado de propósito (ver nota lá). */
export type Periodicidade = 'semanal' | 'mensal' | 'anual';

export const ROTULO_CATEGORIA_RECEBER: Record<CategoriaReceber, string> = {
  servico_os: 'Serviço (OS)',
  venda_balcao: 'Venda de balcão',
  estorno: 'Estorno / Reembolso',
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
  /** A qual empresa (CNPJ) este lançamento pertence — separa o faturamento entre empresas. */
  empresaId: string | null;
  tipo: TipoFinanceiro;
  categoria: CategoriaPagar | CategoriaReceber;
  descricao: string;
  valor: number;
  pago: boolean;
  formaPagamento: FormaPagamento | null;
  dataPagamento: string | null;
  vencimento: string | null; // yyyy-mm-dd
  clienteId: string | null;
  fornecedorId: string | null;
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
  empresaId: string;
  categoria: CategoriaPagar;
  descricao: string;
  valor: string;
  fornecedorId: string;
  vencimento: string;
  observacoes: string;
}

export const dadosContaPagarVazio = (): DadosContaPagar => ({
  empresaId: '',
  categoria: 'despesa_geral',
  descricao: '',
  valor: '',
  fornecedorId: '',
  vencimento: '',
  observacoes: '',
});

export function validarContaPagar(d: DadosContaPagar): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (!d.empresaId) erros.empresaId = 'Selecione a empresa.';
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

// ---- Quitação (marcar como pago/recebido) -----------------------------------

export interface DadosQuitacao {
  formaPagamento: FormaPagamento | '';
}

export function validarQuitacao(d: DadosQuitacao): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (!d.formaPagamento) erros.formaPagamento = 'Selecione a forma de pagamento.';
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
  vencimento: string; // yyyy-mm-dd, só usado em a_prazo
}

export const dadosFaturamentoVazio = (): DadosFaturamento => ({
  empresaId: '',
  situacao: 'a_vista',
  formaPagamento: '',
  vencimento: '',
});

export function validarFaturamento(d: DadosFaturamento): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (!d.empresaId) erros.empresaId = 'Selecione a empresa.';
  if (d.situacao === 'a_vista' && !d.formaPagamento)
    erros.formaPagamento = 'Selecione a forma de pagamento.';
  if (d.situacao === 'a_prazo' && !d.vencimento)
    erros.vencimento = 'Informe o vencimento.';
  return erros;
}

// ---- Estorno (cancela um lançamento já quitado ou vinculado a OS/venda) -----

export interface DadosEstorno {
  motivo: string;
  /** Só pedido quando o original já estava pago/recebido — vira a forma de pagamento da contrapartida. */
  formaPagamento: FormaPagamento | '';
}

export const dadosEstornoVazio = (): DadosEstorno => ({ motivo: '', formaPagamento: '' });

/** `precisaFormaPagamento` = o lançamento original já estava quitado (vai gerar contrapartida). */
export function validarEstorno(d: DadosEstorno, precisaFormaPagamento: boolean): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (!d.motivo.trim()) erros.motivo = 'Explique o motivo do estorno.';
  if (precisaFormaPagamento && !d.formaPagamento)
    erros.formaPagamento = 'Selecione como o dinheiro está sendo devolvido.';
  return erros;
}
