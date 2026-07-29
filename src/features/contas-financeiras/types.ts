/**
 * ============================================================================
 * TIPOS E VALIDAÇÃO — CONTAS FINANCEIRAS
 * ============================================================================
 * Espelha a tabela contas_financeiras (ver despesas_globais_conta_financeira.sql).
 * Cadastro simples do usuário (Cadastros > Contas Financeiras) — cada conta
 * representa ONDE o dinheiro entra/sai de verdade: uma conta bancária, a
 * carteira física (dinheiro em espécie), uma maquineta de cartão, ou uma
 * aplicação. Todo lançamento quitado (pago ou recebido) exige uma conta —
 * ver DadosQuitacao/DadosFaturamento/DadosEstorno em @/features/financeiro.
 * Sem empresa_id de propósito — não foi pedido vínculo por CNPJ aqui, uma
 * conta pode ser usada por qualquer empresa da mesma oficina.
 */

export type TipoContaFinanceira = 'banco' | 'carteira' | 'cartao' | 'investimento';

export const ROTULO_TIPO_CONTA: Record<TipoContaFinanceira, string> = {
  banco: 'Banco',
  carteira: 'Carteira (dinheiro em espécie)',
  cartao: 'Cartão / Maquineta',
  investimento: 'Investimento',
};

export interface ContaFinanceira {
  id?: string;
  tipo: TipoContaFinanceira;
  /** Nome do banco/instituição, ou uma label livre (ex.: "Caixa da loja"). */
  instituicao: string;
  ativo: boolean;
}

export const contaFinanceiraVazia = (): ContaFinanceira => ({
  tipo: 'banco',
  instituicao: '',
  ativo: true,
});

export type ErrosValidacao = Record<string, string>;
export const semErros = (e: ErrosValidacao) => Object.keys(e).length === 0;

export function validarContaFinanceira(c: ContaFinanceira): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (!c.tipo) erros.tipo = 'Selecione o tipo.';
  if (!c.instituicao.trim()) erros.instituicao = 'Informe a instituição.';
  return erros;
}
