/**
 * ============================================================================
 * TIPOS — IMPORTAÇÃO DE XML DE NF-e (entrada de estoque)
 * ============================================================================
 * Espelha o que extraímos do XML da nota (padrão NF-e do SEFAZ). NÃO fala
 * com SEFAZ/webservice nenhum — é só leitura de um arquivo que o usuário já
 * tem em mãos (recebido do fornecedor). Ver CLAUDE.md: emissão fiscal própria
 * é proibida, mas ISSO AQUI é importação de nota de terceiro, não emissão.
 */

export interface ItemNFeExtraido {
  codigoProduto: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
}

export interface DadosNFeExtraida {
  chaveAcesso: string;
  numero: string;
  serie: string;
  fornecedorCnpj: string;
  fornecedorNome: string;
  valorTotal: number;
  itens: ItemNFeExtraido[];
}

/** Como cada item da nota vai ser tratado na importação. */
export interface MapeamentoItem {
  /** id de uma peça existente, ou 'nova' pra criar uma peça a partir do item. */
  pecaId: string | 'nova';
  quantidade: string;
  custoUnit: string;
  incluir: boolean;
}

export interface ResultadoImportacaoNFe {
  pecasCriadas: number;
  entradasRegistradas: number;
}
