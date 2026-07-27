/**
 * ============================================================================
 * ACESSO AO BANCO — DESPESAS FIXAS
 * ============================================================================
 * Único lugar que fala com a tabela `despesas_fixas`. Componentes usam essas
 * funções, nunca o Supabase direto (ver regra em CLAUDE.md).
 */

import { supabase } from '@/lib/supabase';
import type { DespesaFixa, CategoriaDespesaFixa } from '../types';

interface LinhaDespesaFixa {
  id: string;
  empresa_id: string | null;
  descricao: string;
  categoria: CategoriaDespesaFixa;
  valor: number;
  dia_vencimento: number;
  fornecedor_id: string | null;
  ativo: boolean;
  observacoes: string | null;
}

function linhaParaDespesa(l: LinhaDespesaFixa): DespesaFixa {
  return {
    id: l.id,
    empresaId: l.empresa_id ?? '',
    descricao: l.descricao,
    categoria: l.categoria,
    valor: String(l.valor),
    diaVencimento: String(l.dia_vencimento),
    fornecedorId: l.fornecedor_id ?? '',
    ativo: l.ativo,
    observacoes: l.observacoes ?? '',
  };
}

function despesaParaLinha(d: DespesaFixa) {
  return {
    empresa_id: d.empresaId || null,
    descricao: d.descricao,
    categoria: d.categoria,
    valor: Number(d.valor),
    dia_vencimento: Number(d.diaVencimento),
    fornecedor_id: d.fornecedorId || null,
    ativo: d.ativo,
    observacoes: d.observacoes || null,
  };
}

/** Lista despesas fixas. Por padrão só as ativas; `empresaId` filtra por empresa. */
export async function listarDespesasFixas(
  opts: { somenteAtivas?: boolean; empresaId?: string } = {},
): Promise<DespesaFixa[]> {
  const { somenteAtivas = true, empresaId } = opts;
  let query = supabase.from('despesas_fixas').select('*').order('descricao');
  if (somenteAtivas) query = query.eq('ativo', true);
  if (empresaId) query = query.eq('empresa_id', empresaId);

  const { data, error } = await query;
  if (error) throw error;
  return (data as LinhaDespesaFixa[]).map(linhaParaDespesa);
}

export async function criarDespesaFixa(d: DespesaFixa): Promise<DespesaFixa> {
  const { data, error } = await supabase
    .from('despesas_fixas')
    .insert(despesaParaLinha(d))
    .select()
    .single();
  if (error) throw error;
  return linhaParaDespesa(data as LinhaDespesaFixa);
}

export async function atualizarDespesaFixa(d: DespesaFixa): Promise<DespesaFixa> {
  if (!d.id) throw new Error('Despesa fixa sem id não pode ser atualizada.');
  const { data, error } = await supabase
    .from('despesas_fixas')
    .update(despesaParaLinha(d))
    .eq('id', d.id)
    .select()
    .single();
  if (error) throw error;
  return linhaParaDespesa(data as LinhaDespesaFixa);
}

/** Cria se a despesa ainda não tem id, ou atualiza caso já exista. */
export async function salvarDespesaFixa(d: DespesaFixa): Promise<DespesaFixa> {
  return d.id ? atualizarDespesaFixa(d) : criarDespesaFixa(d);
}

/** Desativa/reativa em vez de excluir — pode ter contas já geradas. */
export async function definirAtivoDespesaFixa(id: string, ativo: boolean): Promise<void> {
  const { error } = await supabase.from('despesas_fixas').update({ ativo }).eq('id', id);
  if (error) throw error;
}
