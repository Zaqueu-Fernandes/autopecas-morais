/**
 * ============================================================================
 * TIPOS E VALIDAÇÃO — VENDAS DE BALCÃO
 * ============================================================================
 * Espelha vendas_balcao/venda_itens (ver vendas_balcao.sql). Venda só vende
 * peça (mão de obra é OS). Cliente é opcional — só é exigido se a venda for
 * finalizada como a_prazo/fiado.
 */

export type StatusVenda = 'aberta' | 'finalizada';

export interface VendaBalcao {
  id?: string;
  numero?: number;
  clienteId: string | null;
  status: StatusVenda;
  observacoes: string;
  createdAt?: string;
}

/** Versão usada na listagem: já traz o nome do cliente (join), quando houver. */
export interface VendaBalcaoResumo extends VendaBalcao {
  clienteNome: string | null;
}

export const vendaBalcaoVazia = (): VendaBalcao => ({
  clienteId: null,
  status: 'aberta',
  observacoes: '',
});

export type ErrosValidacao = Record<string, string>;
export const semErros = (e: ErrosValidacao) => Object.keys(e).length === 0;

// ---- Itens da venda ----------------------------------------------------

export interface ItemVenda {
  id?: string;
  vendaId: string;
  pecaId: string;
  movimentacaoId: string | null;
  descricao: string;
  quantidade: number;
  valorUnit: number;
  removido: boolean;
  motivoRemocao: string | null;
  createdAt?: string;
}

export interface DadosItemVenda {
  pecaId: string;
  quantidade: string;
}

export const dadosItemVendaVazio = (): DadosItemVenda => ({ pecaId: '', quantidade: '1' });

export function validarItemVenda(d: DadosItemVenda): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (!d.pecaId) erros.pecaId = 'Selecione a peça.';
  const qtd = Number(d.quantidade);
  if (!d.quantidade.trim() || Number.isNaN(qtd) || qtd <= 0)
    erros.quantidade = 'Informe uma quantidade maior que zero.';
  return erros;
}
