/**
 * ============================================================================
 * ACESSO AO BANCO — ITENS DA OS (peça ou serviço)
 * ============================================================================
 * Único lugar que fala com a tabela `os_itens`. Item de peça sempre passa
 * primeiro pela baixa de estoque (registrarSaida, da feature estoque) — se
 * não houver saldo, a movimentação falha e nenhum item chega a ser criado.
 * Remover um item de peça devolve o estoque via um AJUSTE (nunca edita a
 * movimentação de saída já registrada — o razão é append-only).
 */

import { supabase } from '@/lib/supabase';
import { registrarSaida, registrarAjuste, type Peca } from '@/features/estoque';
import type { ItemOS } from '../types';

interface LinhaItemOS {
  id: string;
  os_id: string;
  tipo: 'peca' | 'servico';
  peca_id: string | null;
  movimentacao_id: string | null;
  descricao: string;
  quantidade: number;
  valor_unit: number;
  removido: boolean;
  motivo_remocao: string | null;
  created_at: string;
}

function linhaParaItem(l: LinhaItemOS): ItemOS {
  return {
    id: l.id,
    osId: l.os_id,
    tipo: l.tipo,
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

/** Lista todos os itens da OS (inclusive removidos, pra manter o histórico visível). */
export async function listarItensPorOS(osId: string): Promise<ItemOS[]> {
  const { data, error } = await supabase
    .from('os_itens')
    .select('*')
    .eq('os_id', osId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as LinhaItemOS[]).map(linhaParaItem);
}

/** Adiciona uma peça à OS: baixa o estoque primeiro, só depois grava o item. */
export async function adicionarItemPeca(osId: string, peca: Peca, quantidade: number): Promise<ItemOS> {
  const movimentacao = await registrarSaida({
    pecaId: peca.id!,
    quantidade,
    origem: 'os',
  });

  const { data, error } = await supabase
    .from('os_itens')
    .insert({
      os_id: osId,
      tipo: 'peca',
      peca_id: peca.id,
      movimentacao_id: movimentacao.id,
      descricao: peca.nome,
      quantidade,
      valor_unit: Number(peca.precoVenda),
    })
    .select()
    .single();
  if (error) throw error;
  return linhaParaItem(data as LinhaItemOS);
}

/** Adiciona um serviço (mão de obra) à OS — não mexe em estoque. */
export async function adicionarItemServico(
  osId: string,
  dados: { descricao: string; quantidade: number; valorUnit: number },
): Promise<ItemOS> {
  const { data, error } = await supabase
    .from('os_itens')
    .insert({
      os_id: osId,
      tipo: 'servico',
      descricao: dados.descricao,
      quantidade: dados.quantidade,
      valor_unit: dados.valorUnit,
    })
    .select()
    .single();
  if (error) throw error;
  return linhaParaItem(data as LinhaItemOS);
}

/** Remove (soft) um item da OS. Se for peça, devolve o estoque via ajuste. */
export async function removerItem(item: ItemOS, motivo: string): Promise<void> {
  if (item.tipo === 'peca' && item.pecaId) {
    await registrarAjuste({
      pecaId: item.pecaId,
      quantidade: item.quantidade,
      observacoes: `Estorno: item removido da OS (${motivo})`,
    });
  }

  const { error } = await supabase
    .from('os_itens')
    .update({ removido: true, motivo_remocao: motivo })
    .eq('id', item.id);
  if (error) throw error;
}
