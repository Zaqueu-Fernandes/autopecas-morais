/**
 * ============================================================================
 * ACESSO AO BANCO — CREDORES
 * ============================================================================
 * Único lugar que fala com a tabela `credores`. Componentes usam essas
 * funções, nunca o Supabase direto (ver regra em CLAUDE.md).
 */

import { supabase } from '@/lib/supabase';
import type { Credor } from '../types';

interface LinhaCredor {
  id: string;
  nome: string;
  documento: string | null;
  telefone: string | null;
  email: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  observacoes: string | null;
}

function linhaParaCredor(l: LinhaCredor): Credor {
  return {
    id: l.id,
    nome: l.nome,
    documento: l.documento ?? '',
    telefone: l.telefone ?? '',
    email: l.email ?? '',
    cep: l.cep ?? '',
    logradouro: l.logradouro ?? '',
    numero: l.numero ?? '',
    complemento: l.complemento ?? '',
    bairro: l.bairro ?? '',
    cidade: l.cidade ?? '',
    uf: l.uf ?? '',
    observacoes: l.observacoes ?? '',
  };
}

function credorParaLinha(c: Credor) {
  return {
    nome: c.nome,
    documento: c.documento || null,
    telefone: c.telefone || null,
    email: c.email || null,
    cep: c.cep || null,
    logradouro: c.logradouro || null,
    numero: c.numero || null,
    complemento: c.complemento || null,
    bairro: c.bairro || null,
    cidade: c.cidade || null,
    uf: c.uf || null,
    observacoes: c.observacoes || null,
  };
}

/** Lista credores ordenados por nome. `busca` filtra por nome (case-insensitive). */
export async function listarCredores(busca?: string): Promise<Credor[]> {
  let query = supabase.from('credores').select('*').order('nome');
  if (busca?.trim()) query = query.ilike('nome', `%${busca.trim()}%`);

  const { data, error } = await query;
  if (error) throw error;
  return (data as LinhaCredor[]).map(linhaParaCredor);
}

export async function criarCredor(credor: Credor): Promise<Credor> {
  const { data, error } = await supabase
    .from('credores')
    .insert(credorParaLinha(credor))
    .select()
    .single();
  if (error) throw error;
  return linhaParaCredor(data as LinhaCredor);
}

export async function atualizarCredor(credor: Credor): Promise<Credor> {
  if (!credor.id) throw new Error('Credor sem id não pode ser atualizado.');
  const { data, error } = await supabase
    .from('credores')
    .update(credorParaLinha(credor))
    .eq('id', credor.id)
    .select()
    .single();
  if (error) throw error;
  return linhaParaCredor(data as LinhaCredor);
}

/** Cria se o credor ainda não tem id, ou atualiza caso já exista. */
export async function salvarCredor(credor: Credor): Promise<Credor> {
  return credor.id ? atualizarCredor(credor) : criarCredor(credor);
}

export async function excluirCredor(id: string): Promise<void> {
  const { error } = await supabase.from('credores').delete().eq('id', id);
  if (error) throw error;
}
