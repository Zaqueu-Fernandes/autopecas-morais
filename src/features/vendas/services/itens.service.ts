/**
 * ============================================================================
 * ACESSO AO BANCO — ITENS DA VENDA (peça)
 * ============================================================================
 * Único lugar que fala com a tabela `venda_itens`. Item sempre passa primeiro
 * pela baixa de estoque (registrarSaida, da feature estoque) — se não houver
 * saldo, a movimentação falha e nenhum item chega a ser criado. Remover um
 * item devolve o estoque via um AJUSTE (o razão é append-only).
 */

import { supabase } from '@/lib/supabase';
import { registrarSaida, registrarAjuste, type Peca } from '@/features/estoque';
import type { ItemVenda } from '../types';

interface LinhaItemVenda {
  id: string;
  venda_id: string;
  peca_id: string;
  movimentacao_id: string | null;
  descricao: string;
  quantidade: number;
  valor_unit: number;
  removido: boolean;
  motivo_remocao: string | null;
  created_at: string;
}

function linhaParaItem(l: LinhaItemVenda): ItemVenda {
  return {
    id: l.id,
    vendaId: l.venda_id,
    pecaId: l.peca_id,
    movimentacaoId: l.movimentacao_id,
    descricao: l.descricao,
    quantidade: l.quantidade,
    valorUnit: Number(l.valor_unit),
    removido: l.removido,
    motivoRemocao: l.motivo_remocao,
    createdAt: l.created_at,
  };
}

/** Lista todos os itens da venda (inclusive removidos, pra manter o histórico visível). */
export async function listarItensPorVenda(vendaId: string): Promise<ItemVenda[]> {
  const { data, error } = await supabase
    .from('venda_itens')
    .select('*')
    .eq('venda_id', vendaId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as LinhaItemVenda[]).map(linhaParaItem);
}

/** Adiciona uma peça à venda: baixa o estoque primeiro, só depois grava o item. */
export async function adicionarItemVenda(vendaId: string, peca: Peca, quantidade: number): Promise<ItemVenda> {
  const movimentacao = await registrarSaida({
    pecaId: peca.id!,
    quantidade,
    origem: 'venda_balcao',
  });

  const { data, error } = await supabase
    .from('venda_itens')
    .insert({
      venda_id: vendaId,
      peca_id: peca.id,
      movimentacao_id: movimentacao.id,
      descricao: peca.nome,
      quantidade,
      valor_unit: Number(peca.precoVenda),
    })
    .select()
    .single();
  if (error) throw error;
  return linhaParaItem(data as LinhaItemVenda);
}

/** Remove (soft) um item da venda, devolvendo o estoque via ajuste. */
export async function removerItemVenda(item: ItemVenda, motivo: string): Promise<void> {
  await registrarAjuste({
    pecaId: item.pecaId,
    quantidade: item.quantidade,
    observacoes: `Estorno: item removido da venda (${motivo})`,
  });

  const { error } = await supabase
    .from('venda_itens')
    .update({ removido: true, motivo_remocao: motivo })
    .eq('id', item.id);
  if (error) throw error;
}
