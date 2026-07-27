/**
 * ============================================================================
 * TIPOS E VALIDAÇÃO — DESPESAS FIXAS
 * ============================================================================
 * Espelha despesas_fixas (ver despesas_fixas.sql). A lista de categorias é
 * duplicada da CategoriaPagar do financeiro de propósito — evita a feature
 * financeiro precisar importar código desta feature (só o inverso: despesas
 * chama criarLancamento do financeiro pra gerar as contas do mês).
 */

export type CategoriaDespesaFixa =
  | 'fornecedor'
  | 'despesa_fixa'
  | 'despesa_variavel'
  | 'imposto'
  | 'folha'
  | 'retirada_lucro';

export const ROTULO_CATEGORIA_DESPESA: Record<CategoriaDespesaFixa, string> = {
  fornecedor: 'Fornecedor',
  despesa_fixa: 'Despesa fixa',
  despesa_variavel: 'Despesa variável',
  imposto: 'Imposto',
  folha: 'Folha de pagamento',
  retirada_lucro: 'Retirada de lucro',
};

export interface DespesaFixa {
  id?: string;
  /** A qual empresa (CNPJ) esta despesa pertence — as contas geradas herdam essa empresa. */
  empresaId: string;
  descricao: string;
  categoria: CategoriaDespesaFixa;
  valor: string; // texto no formulário; vira number ao salvar
  diaVencimento: string; // texto no formulário (1-28); vira number ao salvar
  fornecedorId: string;
  ativo: boolean;
  observacoes: string;
}

export const despesaFixaVazia = (): DespesaFixa => ({
  empresaId: '',
  descricao: '',
  categoria: 'despesa_fixa',
  valor: '',
  diaVencimento: '',
  fornecedorId: '',
  ativo: true,
  observacoes: '',
});

export type ErrosValidacao = Record<string, string>;
export const semErros = (e: ErrosValidacao) => Object.keys(e).length === 0;

export function validarDespesaFixa(d: DespesaFixa): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (!d.empresaId) erros.empresaId = 'Selecione a empresa.';
  if (!d.descricao.trim()) erros.descricao = 'Descreva a despesa.';
  const valor = Number(d.valor);
  if (!d.valor.trim() || Number.isNaN(valor) || valor <= 0)
    erros.valor = 'Informe um valor maior que zero.';
  const dia = Number(d.diaVencimento);
  if (!d.diaVencimento.trim() || Number.isNaN(dia) || dia < 1 || dia > 28)
    erros.diaVencimento = 'Informe um dia entre 1 e 28.';
  if (d.categoria === 'fornecedor' && !d.fornecedorId)
    erros.fornecedorId = 'Selecione o fornecedor.';
  return erros;
}
