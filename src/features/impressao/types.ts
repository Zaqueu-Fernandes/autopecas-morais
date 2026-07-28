/**
 * ============================================================================
 * TIPOS — IMPRESSÃO DE COMPROVANTES
 * ============================================================================
 * Documento genérico o bastante pra servir OS e Venda de balcão (e futuros).
 * `fiscal` sempre false por enquanto — o sistema só emite COMPROVANTE
 * INTERNO, sem valor fiscal (ver CLAUDE.md, seção "Documentos fiscais").
 * Quando a Fase 3 (NFC-e/NFS-e) existir, o DANFE do emissor entra aqui.
 */

export interface ItemImpressao {
  descricao: string;
  quantidade: number;
  valorUnit: number;
}

export interface DocumentoImpressao {
  tipo: 'os' | 'venda';
  titulo: string;
  numero: string | number;
  data: Date;
  cliente?: { nome: string; documento?: string; telefone?: string };
  veiculo?: { placa: string; marcaModelo?: string };
  itens: ItemImpressao[];
  total: number;
  observacoes?: string;
  fiscal: false;
}

/**
 * Documento genérico pra imprimir/exportar uma LISTA (relatório tabular) —
 * usado pelas telas de listagem (Clientes, Estoque, Financeiro…), diferente
 * do comprovante acima (que é um documento único de uma OS/venda). `linhas`
 * já vem formatada como texto (mesmo formato que aparece na tela) — quem
 * monta o documento decide o que exibir, esta camada só desenha.
 */
export interface DocumentoListaImpressao {
  titulo: string;
  /** Ex.: filtro aplicado, período, empresa selecionada — aparece abaixo do título. */
  subtitulo?: string;
  colunas: string[];
  linhas: string[][];
}
