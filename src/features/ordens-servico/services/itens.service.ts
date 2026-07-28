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
import {
  criarLancamento,
  atualizarValorLancamento,
  estornarLancamento,
  buscarLancamentoDeOS,
  type FormaPagamento,
} from '@/features/financeiro';
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

/**
 * Devolve um item de uma OS JÁ FATURADA — cliente devolveu a peça, ou o
 * serviço não funcionou e ele quer o dinheiro de volta. Diferente de
 * removerItem (usado ANTES de faturar, sem tocar no financeiro): aqui
 * também resolve o lado do dinheiro, conforme o faturamento já tinha sido
 * pago ou não:
 *   - Já pago: gera um lançamento de REEMBOLSO (dinheiro saindo de verdade).
 *   - Ainda pendente: ninguém pagou nada ainda, então só reduz o valor a
 *     receber; se a devolução zerar o total, estorna o lançamento inteiro
 *     (e a OS destrava pra 'concluida' — ver estorno.service.ts).
 * Peça devolvida volta ao estoque via AJUSTE (não sobrescreve preco_custo —
 * o valor de venda devolvido não deve virar custo de aquisição da peça).
 */
export async function devolverItem(
  item: ItemOS,
  os: { id: string; numero?: number; clienteId: string },
  motivo: string,
  formaPagamento: FormaPagamento,
): Promise<void> {
  const lancamento = await buscarLancamentoDeOS(os.id);
  if (!lancamento) {
    throw new Error('Não encontrei o faturamento desta OS (pode já ter sido totalmente estornado).');
  }

  if (item.tipo === 'peca' && item.pecaId) {
    await registrarAjuste({
      pecaId: item.pecaId,
      quantidade: item.quantidade,
      observacoes: `Devolução de item da OS #${os.numero ?? '—'} (${motivo})`,
    });
  }

  const { error } = await supabase
    .from('os_itens')
    .update({ removido: true, motivo_remocao: `Devolução: ${motivo}` })
    .eq('id', item.id);
  if (error) throw error;

  const valorItem = item.quantidade * item.valorUnit;

  if (lancamento.pago) {
    await criarLancamento({
      empresaId: lancamento.empresaId,
      tipo: 'pagar',
      categoria: 'estorno',
      descricao: `Devolução — ${item.descricao} (OS #${os.numero ?? '—'})`,
      valor: valorItem,
      pago: true,
      formaPagamento,
      dataPagamento: new Date().toISOString(),
      vencimento: null,
      clienteId: os.clienteId,
      fornecedorId: null,
      osId: os.id,
      vendaId: null,
      despesaFixaId: null,
      periodicidade: null,
      estornoDeId: lancamento.id,
      observacoes: motivo,
    });
  } else {
    const restante = lancamento.valor - valorItem;
    if (restante <= 0) {
      await estornarLancamento(lancamento.id!, { motivo: `Devolução esvaziou a OS — ${motivo}`, formaPagamento: '' });
    } else {
      await atualizarValorLancamento(lancamento.id!, restante);
    }
  }
}
