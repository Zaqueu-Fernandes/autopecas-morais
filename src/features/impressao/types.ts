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
