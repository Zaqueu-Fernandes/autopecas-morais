/**
 * ============================================================================
 * TIPOS — PEDIDO AO FORNECEDOR
 * ============================================================================
 * Não tem tabela no banco (feature sem persistência — ver CLAUDE.md, decisão
 * consciente: é um gerador de documento, não um cadastro). `ItemPedido` só
 * vive no estado da tela enquanto o usuário monta o pedido.
 */

export interface ItemPedido {
  pecaId: string;
  nome: string;
  codigo: string;
  unidade: string;
  /** Cache no momento em que a peça entrou na lista — não recarrega ao vivo. */
  qtdAtual: number;
  estoqueMinimo: number;
  /** Texto no formulário (aceita vírgula) — vira number só na hora de gerar o documento. */
  quantidade: string;
}

export type ErrosValidacao = Record<string, string>;
export const semErros = (e: ErrosValidacao) => Object.keys(e).length === 0;
