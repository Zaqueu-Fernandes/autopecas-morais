/**
 * ============================================================================
 * TIPOS E VALIDAÇÃO — ESTOQUE
 * ============================================================================
 * Espelha as tabelas pecas/movimentacao_estoque (ver estoque.sql).
 * qtd e precoCusto são cache mantido pelo banco (trigger) — a aplicação nunca
 * edita esses dois campos diretamente, só lê.
 */

export interface Peca {
  id?: string;
  codigo: string;
  nome: string;
  descricao: string;
  unidade: string;
  categoria: string;
  precoVenda: string; // texto no formulário; vira number ao salvar
  ativo: boolean;
  observacoes: string;
  /** Cache mantido pelo banco — somente leitura na aplicação. */
  precoCusto: number;
  /** Cache mantido pelo banco (soma do razão) — somente leitura na aplicação. */
  qtd: number;
}

export const pecaVazia = (): Peca => ({
  codigo: '',
  nome: '',
  descricao: '',
  unidade: 'un',
  categoria: '',
  precoVenda: '',
  ativo: true,
  observacoes: '',
  precoCusto: 0,
  qtd: 0,
});

export type ErrosValidacao = Record<string, string>;

export function validarPeca(p: Peca): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (!p.nome.trim()) erros.nome = 'Informe o nome.';
  if (p.precoVenda.trim() && Number.isNaN(Number(p.precoVenda)))
    erros.precoVenda = 'Preço de venda inválido.';
  return erros;
}

export const semErros = (e: ErrosValidacao) => Object.keys(e).length === 0;

// ---- Movimentação de estoque -------------------------------------------------
// Razão append-only: a aplicação só cria movimentações, nunca edita/apaga.

export type TipoMovimentacao = 'entrada' | 'saida' | 'ajuste';

export interface Movimentacao {
  id?: string;
  pecaId: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  custoUnit: number | null;
  fornecedorId: string | null;
  origem: string | null;
  observacoes: string;
  createdAt?: string;
}

/** Dados do formulário de ENTRADA (compra de fornecedor). */
export interface DadosEntrada {
  quantidade: string;
  custoUnit: string;
  fornecedorId: string;
  observacoes: string;
}

export const dadosEntradaVazio = (): DadosEntrada => ({
  quantidade: '',
  custoUnit: '',
  fornecedorId: '',
  observacoes: '',
});

export function validarEntrada(d: DadosEntrada): ErrosValidacao {
  const erros: ErrosValidacao = {};
  const qtd = Number(d.quantidade);
  if (!d.quantidade.trim() || Number.isNaN(qtd) || qtd <= 0)
    erros.quantidade = 'Informe uma quantidade maior que zero.';
  const custo = Number(d.custoUnit);
  if (!d.custoUnit.trim() || Number.isNaN(custo) || custo < 0)
    erros.custoUnit = 'Informe o custo unitário.';
  return erros;
}

/** Dados do formulário de AJUSTE (correção manual, exige motivo). */
export interface DadosAjuste {
  quantidade: string; // sempre digitada positiva; o sentido define o sinal
  sentido: 'aumentar' | 'diminuir';
  observacoes: string; // motivo — obrigatório, fica na auditoria
}

export const dadosAjusteVazio = (): DadosAjuste => ({
  quantidade: '',
  sentido: 'aumentar',
  observacoes: '',
});

export function validarAjuste(d: DadosAjuste): ErrosValidacao {
  const erros: ErrosValidacao = {};
  const qtd = Number(d.quantidade);
  if (!d.quantidade.trim() || Number.isNaN(qtd) || qtd <= 0)
    erros.quantidade = 'Informe uma quantidade maior que zero.';
  if (!d.observacoes.trim()) erros.observacoes = 'Informe o motivo do ajuste.';
  return erros;
}
