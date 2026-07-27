/**
 * ============================================================================
 * ACESSO AO BANCO — FINANCEIRO
 * ============================================================================
 * Único lugar que fala com a tabela `financeiro`. Componentes usam essas
 * funções, nunca o Supabase direto (ver regra em CLAUDE.md).
 */

import { supabase } from '@/lib/supabase';
import type { LancamentoFinanceiro, TipoFinanceiro, FormaPagamento } from '../types';

interface LinhaFinanceiro {
  id: string;
  tipo: TipoFinanceiro;
  categoria: string;
  descricao: string;
  valor: number;
  pago: boolean;
  forma_pagamento: FormaPagamento | null;
  data_pagamento: string | null;
  vencimento: string | null;
  cliente_id: string | null;
  fornecedor_id: string | null;
  os_id: string | null;
  venda_id: string | null;
  despesa_fixa_id: string | null;
  observacoes: string | null;
  created_at: string;
}

function linhaParaLancamento(l: LinhaFinanceiro): LancamentoFinanceiro {
  return {
    id: l.id,
    tipo: l.tipo,
    categoria: l.categoria as LancamentoFinanceiro['categoria'],
    descricao: l.descricao,
    valor: Number(l.valor),
    pago: l.pago,
    formaPagamento: l.forma_pagamento,
    dataPagamento: l.data_pagamento,
    vencimento: l.vencimento,
    clienteId: l.cliente_id,
    fornecedorId: l.fornecedor_id,
    osId: l.os_id,
    vendaId: l.venda_id,
    despesaFixaId: l.despesa_fixa_id,
    observacoes: l.observacoes ?? '',
    createdAt: l.created_at,
  };
}

/** Lista lançamentos, mais recentes primeiro. Filtros opcionais por tipo/pago. */
export async function listarFinanceiro(opts: { tipo?: TipoFinanceiro; pago?: boolean } = {}): Promise<LancamentoFinanceiro[]> {
  let query = supabase.from('financeiro').select('*').order('vencimento', { ascending: true, nullsFirst: false });
  if (opts.tipo) query = query.eq('tipo', opts.tipo);
  if (opts.pago !== undefined) query = query.eq('pago', opts.pago);

  const { data, error } = await query;
  if (error) throw error;
  return (data as LinhaFinanceiro[]).map(linhaParaLancamento);
}

export async function criarLancamento(l: LancamentoFinanceiro): Promise<LancamentoFinanceiro> {
  const { data, error } = await supabase
    .from('financeiro')
    .insert({
      tipo: l.tipo,
      categoria: l.categoria,
      descricao: l.descricao,
      valor: l.valor,
      pago: l.pago,
      forma_pagamento: l.formaPagamento,
      data_pagamento: l.dataPagamento,
      vencimento: l.vencimento,
      cliente_id: l.clienteId,
      fornecedor_id: l.fornecedorId,
      os_id: l.osId,
      venda_id: l.vendaId,
      despesa_fixa_id: l.despesaFixaId,
      observacoes: l.observacoes || null,
    })
    .select()
    .single();
  if (error) throw error;
  return linhaParaLancamento(data as LinhaFinanceiro);
}

/** Marca um lançamento como quitado (pago ou recebido, conforme o tipo). */
export async function quitarLancamento(id: string, formaPagamento: FormaPagamento): Promise<LancamentoFinanceiro> {
  const { data, error } = await supabase
    .from('financeiro')
    .update({
      pago: true,
      forma_pagamento: formaPagamento,
      data_pagamento: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return linhaParaLancamento(data as LinhaFinanceiro);
}
