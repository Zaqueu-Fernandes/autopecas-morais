/**
 * ============================================================================
 * ACESSO AO BANCO — VENDAS DE BALCÃO
 * ============================================================================
 * Único lugar que fala com a tabela `vendas_balcao`. Componentes usam essas
 * funções, nunca o Supabase direto (ver regra em CLAUDE.md).
 */

import { supabase } from '@/lib/supabase';
import type { VendaBalcao, VendaBalcaoResumo, StatusVenda } from '../types';

interface LinhaVenda {
  id: string;
  numero: number;
  cliente_id: string | null;
  status: StatusVenda;
  observacoes: string | null;
  created_at: string;
}

function linhaParaVenda(l: LinhaVenda): VendaBalcao {
  return {
    id: l.id,
    numero: l.numero,
    clienteId: l.cliente_id,
    status: l.status,
    observacoes: l.observacoes ?? '',
    createdAt: l.created_at,
  };
}

interface LinhaVendaComJoin extends LinhaVenda {
  clientes: { nome: string } | null;
}

function linhaParaResumo(l: LinhaVendaComJoin): VendaBalcaoResumo {
  return { ...linhaParaVenda(l), clienteNome: l.clientes?.nome ?? null };
}

/** Lista vendas mais recentes primeiro, com nome do cliente quando houver. */
export async function listarVendas(opts: { status?: StatusVenda } = {}): Promise<VendaBalcaoResumo[]> {
  let query = supabase
    .from('vendas_balcao')
    .select('*, clientes(nome)')
    .order('numero', { ascending: false });
  if (opts.status) query = query.eq('status', opts.status);

  const { data, error } = await query;
  if (error) throw error;
  return (data as LinhaVendaComJoin[]).map(linhaParaResumo);
}

export async function buscarVendaPorId(id: string): Promise<VendaBalcaoResumo> {
  const { data, error } = await supabase
    .from('vendas_balcao')
    .select('*, clientes(nome)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return linhaParaResumo(data as LinhaVendaComJoin);
}

/** Abre uma venda nova (balcão começa a registrar itens imediatamente). */
export async function abrirVenda(): Promise<VendaBalcao> {
  const { data, error } = await supabase.from('vendas_balcao').insert({}).select().single();
  if (error) throw error;
  return linhaParaVenda(data as LinhaVenda);
}

/** Define/troca o cliente da venda (precisa ter cliente pra finalizar a_prazo/fiado). */
export async function definirClienteVenda(id: string, clienteId: string | null): Promise<VendaBalcao> {
  const { data, error } = await supabase
    .from('vendas_balcao')
    .update({ cliente_id: clienteId })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return linhaParaVenda(data as LinhaVenda);
}
