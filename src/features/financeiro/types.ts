/**
 * ============================================================================
 * TIPOS E VALIDAÇÃO — FINANCEIRO
 * ============================================================================
 * Espelha a tabela financeiro (ver financeiro.sql). `pago` = quitado
 * (recebido, no caso de tipo='receber'; pago, no caso de tipo='pagar').
 */

export type TipoFinanceiro = 'pagar' | 'receber';

export type CategoriaPagar =
  | 'fornecedor'
  | 'despesa_fixa'
  | 'despesa_variavel'
  | 'imposto'
  | 'folha'
  | 'retirada_lucro';

export type CategoriaReceber = 'servico_os' | 'venda_balcao';

export const ROTULO_CATEGORIA_PAGAR: Record<CategoriaPagar, string> = {
  fornecedor: 'Fornecedor',
  despesa_fixa: 'Despesa fixa',
  despesa_variavel: 'Despesa variável',
  imposto: 'Imposto',
  folha: 'Folha de pagamento',
  retirada_lucro: 'Retirada de lucro',
};

export const ROTULO_CATEGORIA_RECEBER: Record<CategoriaReceber, string> = {
  servico_os: 'Serviço (OS)',
  venda_balcao: 'Venda de balcão',
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
  vencimento: string;
  observacoes: string;
}

export const dadosContaPagarVazio = (): DadosContaPagar => ({
  categoria: 'despesa_variavel',
  descricao: '',
  valor: '',
  fornecedorId: '',
  vencimento: '',
  observacoes: '',
});

export function validarContaPagar(d: DadosContaPagar): ErrosValidacao {
  const erros: ErrosValidacao = {};
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
  situacao: SituacaoRecebimento;
  formaPagamento: FormaPagamento | '';
  vencimento: string; // yyyy-mm-dd, só usado em a_prazo
}

export const dadosFaturamentoVazio = (): DadosFaturamento => ({
  situacao: 'a_vista',
  formaPagamento: '',
  vencimento: '',
});

export function validarFaturamento(d: DadosFaturamento): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (d.situacao === 'a_vista' && !d.formaPagamento)
    erros.formaPagamento = 'Selecione a forma de pagamento.';
  if (d.situacao === 'a_prazo' && !d.vencimento)
    erros.vencimento = 'Informe o vencimento.';
  return erros;
}
