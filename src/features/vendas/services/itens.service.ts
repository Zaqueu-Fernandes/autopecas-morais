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
import {
  criarLancamento,
  atualizarValorLancamento,
  estornarLancamento,
  buscarLancamentoDeVenda,
  type FormaPagamento,
} from '@/features/financeiro';
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

/**
 * Devolve um item de uma venda JÁ FINALIZADA — cliente devolveu a peça.
 * Mesma lógica de devolverItem (ordens-servico): se a venda já tinha sido
 * paga, gera um REEMBOLSO; se ainda estava pendente, só reduz o valor a
 * receber (zerando, estorna o lançamento inteiro e destrava a venda).
 */
export async function devolverItemVenda(
  item: ItemVenda,
  venda: { id: string; numero?: number; clienteId: string | null },
  motivo: string,
  formaPagamento: FormaPagamento,
  contaFinanceiraId: string,
): Promise<void> {
  const lancamento = await buscarLancamentoDeVenda(venda.id);
  if (!lancamento) {
    throw new Error('Não encontrei o faturamento desta venda (pode já ter sido totalmente estornado).');
  }

  await registrarAjuste({
    pecaId: item.pecaId,
    quantidade: item.quantidade,
    observacoes: `Devolução de item da venda #${venda.numero ?? '—'} (${motivo})`,
  });

  const { error } = await supabase
    .from('venda_itens')
    .update({ removido: true, motivo_remocao: `Devolução: ${motivo}` })
    .eq('id', item.id);
  if (error) throw error;

  const valorItem = item.quantidade * item.valorUnit;

  if (lancamento.pago) {
    await criarLancamento({
      empresaId: lancamento.empresaId,
      tipo: 'pagar',
      categoria: 'estorno',
      descricao: `Devolução — ${item.descricao} (venda #${venda.numero ?? '—'})`,
      valor: valorItem,
      pago: true,
      formaPagamento,
      contaFinanceiraId,
      dataPagamento: new Date().toISOString(),
      vencimento: null,
      clienteId: venda.clienteId,
      fornecedorId: null,
      osId: null,
      vendaId: venda.id,
      despesaFixaId: null,
      periodicidade: null,
      estornoDeId: lancamento.id,
      observacoes: motivo,
    });
  } else {
    const restante = lancamento.valor - valorItem;
    if (restante <= 0) {
      await estornarLancamento(lancamento.id!, {
        motivo: `Devolução esvaziou a venda — ${motivo}`,
        formaPagamento: '',
        contaFinanceiraId: '',
      });
    } else {
      await atualizarValorLancamento(lancamento.id!, restante);
    }
  }
}
