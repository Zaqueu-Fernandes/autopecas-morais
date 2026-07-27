/**
 * ============================================================================
 * ACESSO AO BANCO — PEÇAS
 * ============================================================================
 * Único lugar que fala com a tabela `pecas`. Componentes usam essas funções,
 * nunca o Supabase direto (ver regra em CLAUDE.md).
 *
 * IMPORTANTE: qtd e preco_custo NUNCA entram nos payloads de criar/atualizar —
 * esses campos só mudam via trigger, a partir de movimentacao_estoque.
 */

import { supabase } from '@/lib/supabase';
import type { Peca } from '../types';

interface LinhaPeca {
  id: string;
  codigo: string | null;
  nome: string;
  descricao: string | null;
  unidade: string;
  categoria: string | null;
  preco_custo: number;
  preco_venda: number;
  qtd: number;
  ativo: boolean;
  observacoes: string | null;
}

function linhaParaPeca(l: LinhaPeca): Peca {
  return {
    id: l.id,
    codigo: l.codigo ?? '',
    nome: l.nome,
    descricao: l.descricao ?? '',
    unidade: l.unidade,
    categoria: l.categoria ?? '',
    precoVenda: String(l.preco_venda),
    ativo: l.ativo,
    observacoes: l.observacoes ?? '',
    precoCusto: Number(l.preco_custo),
    qtd: l.qtd,
  };
}

/** Payload de criação/edição — de propósito NÃO inclui qtd nem preco_custo. */
function pecaParaLinha(p: Peca) {
  return {
    codigo: p.codigo || null,
    nome: p.nome,
    descricao: p.descricao || null,
    unidade: p.unidade || 'un',
    categoria: p.categoria || null,
    preco_venda: p.precoVenda.trim() ? Number(p.precoVenda) : 0,
    ativo: p.ativo,
    observacoes: p.observacoes || null,
  };
}

/** Lista peças. Por padrão só as ativas; `busca` filtra por nome ou código. */
export async function listarPecas(opts: { busca?: string; somenteAtivas?: boolean } = {}): Promise<Peca[]> {
  const { busca, somenteAtivas = true } = opts;
  let query = supabase.from('pecas').select('*').order('nome');
  if (somenteAtivas) query = query.eq('ativo', true);
  if (busca?.trim()) query = query.or(`nome.ilike.%${busca.trim()}%,codigo.ilike.%${busca.trim()}%`);

  const { data, error } = await query;
  if (error) throw error;
  return (data as LinhaPeca[]).map(linhaParaPeca);
}

export async function criarPeca(peca: Peca): Promise<Peca> {
  const { data, error } = await supabase
    .from('pecas')
    .insert(pecaParaLinha(peca))
    .select()
    .single();
  if (error) throw error;
  return linhaParaPeca(data as LinhaPeca);
}

export async function atualizarPeca(peca: Peca): Promise<Peca> {
  if (!peca.id) throw new Error('Peça sem id não pode ser atualizada.');
  const { data, error } = await supabase
    .from('pecas')
    .update(pecaParaLinha(peca))
    .eq('id', peca.id)
    .select()
    .single();
  if (error) throw error;
  return linhaParaPeca(data as LinhaPeca);
}

/** Cria se a peça ainda não tem id, ou atualiza caso já exista. */
export async function salvarPeca(peca: Peca): Promise<Peca> {
  return peca.id ? atualizarPeca(peca) : criarPeca(peca);
}

/** Desativa/reativa em vez de excluir — peça pode ter histórico de movimentação. */
export async function definirAtivoPeca(id: string, ativo: boolean): Promise<void> {
  const { error } = await supabase.from('pecas').update({ ativo }).eq('id', id);
  if (error) throw error;
}
