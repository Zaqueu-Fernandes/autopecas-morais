/**
 * ============================================================================
 * ACESSO AO BANCO — FORNECEDORES
 * ============================================================================
 * Único lugar que fala com a tabela `fornecedores`. Componentes usam essas
 * funções, nunca o Supabase direto (ver regra em CLAUDE.md).
 */

import { supabase } from '@/lib/supabase';
import type { Fornecedor } from '../types';

interface LinhaFornecedor {
  id: string;
  nome: string;
  cnpj: string | null;
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

function linhaParaFornecedor(l: LinhaFornecedor): Fornecedor {
  return {
    id: l.id,
    nome: l.nome,
    cnpj: l.cnpj ?? '',
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

function fornecedorParaLinha(f: Fornecedor) {
  return {
    nome: f.nome,
    cnpj: f.cnpj || null,
    telefone: f.telefone || null,
    email: f.email || null,
    cep: f.cep || null,
    logradouro: f.logradouro || null,
    numero: f.numero || null,
    complemento: f.complemento || null,
    bairro: f.bairro || null,
    cidade: f.cidade || null,
    uf: f.uf || null,
    observacoes: f.observacoes || null,
  };
}

/** Lista fornecedores ordenados por nome. `busca` filtra por nome (case-insensitive). */
export async function listarFornecedores(busca?: string): Promise<Fornecedor[]> {
  let query = supabase.from('fornecedores').select('*').order('nome');
  if (busca?.trim()) query = query.ilike('nome', `%${busca.trim()}%`);

  const { data, error } = await query;
  if (error) throw error;
  return (data as LinhaFornecedor[]).map(linhaParaFornecedor);
}

export async function criarFornecedor(fornecedor: Fornecedor): Promise<Fornecedor> {
  const { data, error } = await supabase
    .from('fornecedores')
    .insert(fornecedorParaLinha(fornecedor))
    .select()
    .single();
  if (error) throw error;
  return linhaParaFornecedor(data as LinhaFornecedor);
}

export async function atualizarFornecedor(fornecedor: Fornecedor): Promise<Fornecedor> {
  if (!fornecedor.id) throw new Error('Fornecedor sem id não pode ser atualizado.');
  const { data, error } = await supabase
    .from('fornecedores')
    .update(fornecedorParaLinha(fornecedor))
    .eq('id', fornecedor.id)
    .select()
    .single();
  if (error) throw error;
  return linhaParaFornecedor(data as LinhaFornecedor);
}

/** Cria se o fornecedor ainda não tem id, ou atualiza caso já exista. */
export async function salvarFornecedor(fornecedor: Fornecedor): Promise<Fornecedor> {
  return fornecedor.id ? atualizarFornecedor(fornecedor) : criarFornecedor(fornecedor);
}

export async function excluirFornecedor(id: string): Promise<void> {
  const { error } = await supabase.from('fornecedores').delete().eq('id', id);
  if (error) throw error;
}
