/**
 * ============================================================================
 * ACESSO AO BANCO — CLIENTES
 * ============================================================================
 * Único lugar que fala com a tabela `clientes`. Componentes usam essas
 * funções, nunca o Supabase direto (ver regra em CLAUDE.md).
 */

import { supabase } from '@/lib/supabase';
import type { Cliente } from '../types';

interface LinhaCliente {
  id: string;
  nome: string;
  tipo_pessoa: 'PF' | 'PJ';
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

function linhaParaCliente(l: LinhaCliente): Cliente {
  return {
    id: l.id,
    nome: l.nome,
    tipoPessoa: l.tipo_pessoa,
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

function clienteParaLinha(c: Cliente) {
  return {
    nome: c.nome,
    tipo_pessoa: c.tipoPessoa,
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

/** Lista clientes ordenados por nome. `busca` filtra por nome (case-insensitive). */
export async function listarClientes(busca?: string): Promise<Cliente[]> {
  let query = supabase.from('clientes').select('*').order('nome');
  if (busca?.trim()) query = query.ilike('nome', `%${busca.trim()}%`);

  const { data, error } = await query;
  if (error) throw error;
  return (data as LinhaCliente[]).map(linhaParaCliente);
}

export async function criarCliente(cliente: Cliente): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .insert(clienteParaLinha(cliente))
    .select()
    .single();
  if (error) throw error;
  return linhaParaCliente(data as LinhaCliente);
}

export async function atualizarCliente(cliente: Cliente): Promise<Cliente> {
  if (!cliente.id) throw new Error('Cliente sem id não pode ser atualizado.');
  const { data, error } = await supabase
    .from('clientes')
    .update(clienteParaLinha(cliente))
    .eq('id', cliente.id)
    .select()
    .single();
  if (error) throw error;
  return linhaParaCliente(data as LinhaCliente);
}

/** Cria se o cliente ainda não tem id, ou atualiza caso já exista. */
export async function salvarCliente(cliente: Cliente): Promise<Cliente> {
  return cliente.id ? atualizarCliente(cliente) : criarCliente(cliente);
}

export async function excluirCliente(id: string): Promise<void> {
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) throw error;
}
