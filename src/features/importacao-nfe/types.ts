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
  /** CNPJ do destinatário (dest) — o CNPJ da autopeças morais que recebeu a nota. */
  destinatarioCnpj: string;
  valorTotal: number;
  itens: ItemNFeExtraido[];
}

/** Como cada item da nota vai ser tratado na importação. */
export interface MapeamentoItem {
  /** id de uma peça existente, ou 'nova' pra criar uma peça a partir do item. */
  pecaId: string | 'nova';
  quantidade: string;
  custoUnit: string;
  /**
   * Só usados quando pecaId='nova'. `margem` é só uma CALCULADORA (igual
   * FormPeca) — sugere `precoVenda` a partir do custo, mas não é salva em
   * lugar nenhum; `precoVenda` continua editável manualmente por cima do
   * valor sugerido. Peça existente MANTÉM o preço de venda que já tinha (a
   * importação nunca sobrescreve isso, só o custo via a entrada).
   */
  margem: string;
  precoVenda: string;
  incluir: boolean;
}

export interface ResultadoImportacaoNFe {
  pecasCriadas: number;
  entradasRegistradas: number;
}
