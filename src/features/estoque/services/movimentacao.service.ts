/**
 * ============================================================================
 * ACESSO AO BANCO — MOVIMENTAÇÃO DE ESTOQUE (razão)
 * ============================================================================
 * Único lugar que fala com a tabela `movimentacao_estoque`. Só faz INSERT —
 * é um razão contábil, correções entram como nova linha (tipo 'ajuste'),
 * nunca UPDATE/DELETE de uma movimentação existente.
 *
 * O saldo/custo de pecas é recalculado por trigger no banco (ver estoque.sql);
 * depois de registrar uma movimentação, recarregue a peça pelo pecas.service.
 */

import { supabase } from '@/lib/supabase';
import type { Movimentacao } from '../types';

interface LinhaMovimentacao {
  id: string;
  peca_id: string;
  tipo: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  custo_unit: number | null;
  fornecedor_id: string | null;
  origem: string | null;
  observacoes: string | null;
  created_at: string;
}

function linhaParaMovimentacao(l: LinhaMovimentacao): Movimentacao {
  return {
    id: l.id,
    pecaId: l.peca_id,
    tipo: l.tipo,
    quantidade: l.quantidade,
    custoUnit: l.custo_unit,
    fornecedorId: l.fornecedor_id,
    origem: l.origem,
    observacoes: l.observacoes ?? '',
    createdAt: l.created_at,
  };
}

/** Histórico de movimentações de uma peça, mais recente primeiro. */
export async function listarMovimentacoesPorPeca(pecaId: string): Promise<Movimentacao[]> {
  const { data, error } = await supabase
    .from('movimentacao_estoque')
    .select('*')
    .eq('peca_id', pecaId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as LinhaMovimentacao[]).map(linhaParaMovimentacao);
}

/** Registra entrada de compra: soma ao saldo e vira o novo preço de custo cacheado. */
export async function registrarEntrada(input: {
  pecaId: string;
  quantidade: number;
  custoUnit: number;
  fornecedorId?: string;
  observacoes?: string;
}): Promise<void> {
  const { error } = await supabase.from('movimentacao_estoque').insert({
    peca_id: input.pecaId,
    tipo: 'entrada',
    quantidade: input.quantidade,
    custo_unit: input.custoUnit,
    fornecedor_id: input.fornecedorId || null,
    origem: 'compra_fornecedor',
    observacoes: input.observacoes || null,
  });
  if (error) throw error;
}

/**
 * Registra ajuste manual (correção de contagem, perda, quebra...). `quantidade`
 * já deve vir com o sinal certo (positivo aumenta, negativo diminui o saldo).
 */
export async function registrarAjuste(input: {
  pecaId: string;
  quantidade: number;
  observacoes: string;
}): Promise<void> {
  const { error } = await supabase.from('movimentacao_estoque').insert({
    peca_id: input.pecaId,
    tipo: 'ajuste',
    quantidade: input.quantidade,
    origem: 'ajuste_manual',
    observacoes: input.observacoes,
  });
  if (error) throw error;
}

/**
 * Registra saída por uso (OS ou Venda de balcão), que sabem a origem exata da
 * baixa. Devolve o id da movimentação — quem chama (ex.: os_itens) guarda essa
 * referência pra poder estornar depois.
 */
export async function registrarSaida(input: {
  pecaId: string;
  quantidade: number;
  origem: string;
  observacoes?: string;
}): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('movimentacao_estoque')
    .insert({
      peca_id: input.pecaId,
      tipo: 'saida',
      quantidade: input.quantidade,
      origem: input.origem,
      observacoes: input.observacoes || null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data as { id: string };
}
