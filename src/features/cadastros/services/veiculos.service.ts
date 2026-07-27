/**
 * ============================================================================
 * ACESSO AO BANCO — VEÍCULOS
 * ============================================================================
 * Único lugar que fala com a tabela `veiculos`. Componentes usam essas
 * funções, nunca o Supabase direto (ver regra em CLAUDE.md).
 * Veículo sempre pertence a um cliente (cliente_id).
 */

import { supabase } from '@/lib/supabase';
import type { Veiculo } from '../types';

interface LinhaVeiculo {
  id: string;
  cliente_id: string;
  placa: string;
  marca: string | null;
  modelo: string | null;
  ano: number | null;
  cor: string | null;
  quilometragem: number | null;
  observacoes: string | null;
}

function linhaParaVeiculo(l: LinhaVeiculo): Veiculo {
  return {
    id: l.id,
    clienteId: l.cliente_id,
    placa: l.placa,
    marca: l.marca ?? '',
    modelo: l.modelo ?? '',
    ano: l.ano != null ? String(l.ano) : '',
    cor: l.cor ?? '',
    quilometragem: l.quilometragem != null ? String(l.quilometragem) : '',
    observacoes: l.observacoes ?? '',
  };
}

function veiculoParaLinha(v: Veiculo) {
  return {
    cliente_id: v.clienteId,
    placa: v.placa.trim().toUpperCase(),
    marca: v.marca || null,
    modelo: v.modelo || null,
    ano: v.ano.trim() ? Number(v.ano) : null,
    cor: v.cor || null,
    quilometragem: v.quilometragem.trim() ? Number(v.quilometragem) : null,
    observacoes: v.observacoes || null,
  };
}

/** Lista os veículos de um cliente específico, mais recentes primeiro. */
export async function listarVeiculosPorCliente(clienteId: string): Promise<Veiculo[]> {
  const { data, error } = await supabase
    .from('veiculos')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as LinhaVeiculo[]).map(linhaParaVeiculo);
}

export async function criarVeiculo(veiculo: Veiculo): Promise<Veiculo> {
  const { data, error } = await supabase
    .from('veiculos')
    .insert(veiculoParaLinha(veiculo))
    .select()
    .single();
  if (error) throw error;
  return linhaParaVeiculo(data as LinhaVeiculo);
}

export async function atualizarVeiculo(veiculo: Veiculo): Promise<Veiculo> {
  if (!veiculo.id) throw new Error('Veículo sem id não pode ser atualizado.');
  const { data, error } = await supabase
    .from('veiculos')
    .update(veiculoParaLinha(veiculo))
    .eq('id', veiculo.id)
    .select()
    .single();
  if (error) throw error;
  return linhaParaVeiculo(data as LinhaVeiculo);
}

/** Cria se o veículo ainda não tem id, ou atualiza caso já exista. */
export async function salvarVeiculo(veiculo: Veiculo): Promise<Veiculo> {
  return veiculo.id ? atualizarVeiculo(veiculo) : criarVeiculo(veiculo);
}

export async function excluirVeiculo(id: string): Promise<void> {
  const { error } = await supabase.from('veiculos').delete().eq('id', id);
  if (error) throw error;
}
