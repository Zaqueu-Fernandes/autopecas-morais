/**
 * ============================================================================
 * TIPOS E VALIDAÇÃO — CATEGORIAS DE DESPESA / CONTA A PAGAR
 * ============================================================================
 * Espelha categorias_despesa (ver categorias_despesa.sql). `chave` é o que
 * fica gravado em despesas_fixas.categoria e financeiro.categoria — estável,
 * nunca muda depois de criada. `nome` é só o rótulo exibido, editável mesmo
 * em categorias protegidas (só a chave é imutável). Categorias protegidas
 * (as 5 originais: fornecedor, despesa_geral, imposto, folha, retirada_lucro)
 * não podem ser desativadas/excluídas — têm regra de negócio presa à chave
 * (ver REGRA DE OURO de retirada_lucro em financeiro.sql).
 */

export interface Categoria {
  id?: string;
  chave: string;
  nome: string;
  protegida: boolean;
  ativa: boolean;
}

export type ErrosValidacao = Record<string, string>;
export const semErros = (e: ErrosValidacao) => Object.keys(e).length === 0;

export function validarNomeCategoria(nome: string): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (!nome.trim()) erros.nome = 'Dê um nome pra categoria.';
  return erros;
}

const MARCAS_DIACRITICAS = /[̀-ͯ]/g;

/** Slug estável a partir do nome — vira a `chave`, gravada em despesas/financeiro. */
export function gerarChaveCategoria(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(MARCAS_DIACRITICAS, '') // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
