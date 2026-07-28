/**
 * ============================================================================
 * ACESSO AO BANCO — CATEGORIAS DE DESPESA / CONTA A PAGAR
 * ============================================================================
 * Único lugar que fala com a tabela `categorias_despesa`. Componentes usam
 * essas funções, nunca o Supabase direto (ver regra em CLAUDE.md).
 */

import { supabase } from '@/lib/supabase';
import type { Categoria } from '../types';
import { gerarChaveCategoria } from '../types';

interface LinhaCategoria {
  id: string;
  chave: string;
  nome: string;
  protegida: boolean;
  ativa: boolean;
}

function linhaParaCategoria(l: LinhaCategoria): Categoria {
  return { id: l.id, chave: l.chave, nome: l.nome, protegida: l.protegida, ativa: l.ativa };
}

/** Lista categorias. Por padrão só as ativas, ordenadas por nome. */
export async function listarCategorias(opts: { somenteAtivas?: boolean } = {}): Promise<Categoria[]> {
  const { somenteAtivas = true } = opts;
  let query = supabase.from('categorias_despesa').select('*').order('nome');
  if (somenteAtivas) query = query.eq('ativa', true);

  const { data, error } = await query;
  if (error) throw error;
  return (data as LinhaCategoria[]).map(linhaParaCategoria);
}

/** Cria uma categoria nova — a chave é gerada a partir do nome (slug estável). */
export async function criarCategoria(nome: string): Promise<Categoria> {
  const { data, error } = await supabase
    .from('categorias_despesa')
    .insert({ chave: gerarChaveCategoria(nome), nome, protegida: false, ativa: true })
    .select()
    .single();
  if (error) throw error;
  return linhaParaCategoria(data as LinhaCategoria);
}

/** Renomeia (rótulo exibido) — permitido mesmo em categoria protegida; a chave nunca muda. */
export async function renomearCategoria(id: string, nome: string): Promise<Categoria> {
  const { data, error } = await supabase
    .from('categorias_despesa')
    .update({ nome })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return linhaParaCategoria(data as LinhaCategoria);
}

/** Desativa/reativa — bloqueado pra categoria protegida (chamar só depois de checar `protegida`). */
export async function definirAtivaCategoria(id: string, ativa: boolean): Promise<void> {
  const { error } = await supabase.from('categorias_despesa').update({ ativa }).eq('id', id);
  if (error) throw error;
}

/** true se alguma despesa recorrente ou lançamento do financeiro já usou esta chave. */
export async function categoriaEmUso(chave: string): Promise<boolean> {
  const [despesas, financeiro] = await Promise.all([
    supabase.from('despesas_fixas').select('id', { count: 'exact', head: true }).eq('categoria', chave),
    supabase.from('financeiro').select('id', { count: 'exact', head: true }).eq('categoria', chave),
  ]);
  if (despesas.error) throw despesas.error;
  if (financeiro.error) throw financeiro.error;
  return (despesas.count ?? 0) > 0 || (financeiro.count ?? 0) > 0;
}

/** Exclui de verdade — só chame depois de confirmar que não é protegida nem está em uso. */
export async function excluirCategoria(id: string): Promise<void> {
  const { error } = await supabase.from('categorias_despesa').delete().eq('id', id);
  if (error) throw error;
}

/** true se o erro veio de nome/chave duplicados. */
export function ehViolacaoDeUnicidade(erro: unknown): boolean {
  return typeof erro === 'object' && erro !== null && (erro as { code?: string }).code === '23505';
}
