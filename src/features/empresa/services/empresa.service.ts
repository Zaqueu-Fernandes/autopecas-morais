/**
 * ============================================================================
 * ACESSO AO BANCO — EMPRESAS
 * ============================================================================
 * Único lugar que fala com a tabela `empresa_config`. Não é mais singleton —
 * pode ter várias empresas (CNPJs) cadastradas.
 */

import { supabase } from '@/lib/supabase';
import type { Empresa, RegimeTributario } from '../types';

interface LinhaEmpresa {
  id: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  regime: RegimeTributario;
  limite_anual_mei: number;
}

function linhaParaEmpresa(l: LinhaEmpresa): Empresa {
  return {
    id: l.id,
    nomeFantasia: l.nome_fantasia ?? '',
    cnpj: l.cnpj ?? '',
    regime: l.regime,
    limiteAnualMei: String(l.limite_anual_mei),
  };
}

function empresaParaLinha(e: Empresa) {
  return {
    nome_fantasia: e.nomeFantasia,
    cnpj: e.cnpj || null,
    regime: e.regime,
    limite_anual_mei: Number(e.limiteAnualMei) || 0,
  };
}

/** Lista todas as empresas cadastradas, ordenadas por nome. */
export async function listarEmpresas(): Promise<Empresa[]> {
  const { data, error } = await supabase.from('empresa_config').select('*').order('nome_fantasia');
  if (error) throw error;
  return (data as LinhaEmpresa[]).map(linhaParaEmpresa);
}

export async function criarEmpresa(empresa: Empresa): Promise<Empresa> {
  const { data, error } = await supabase
    .from('empresa_config')
    .insert(empresaParaLinha(empresa))
    .select()
    .single();
  if (error) throw error;
  return linhaParaEmpresa(data as LinhaEmpresa);
}

export async function atualizarEmpresa(empresa: Empresa): Promise<Empresa> {
  if (!empresa.id) throw new Error('Empresa sem id não pode ser atualizada.');
  const { data, error } = await supabase
    .from('empresa_config')
    .update(empresaParaLinha(empresa))
    .eq('id', empresa.id)
    .select()
    .single();
  if (error) throw error;
  return linhaParaEmpresa(data as LinhaEmpresa);
}

/** Cria se a empresa ainda não tem id, ou atualiza caso já exista. */
export async function salvarEmpresa(empresa: Empresa): Promise<Empresa> {
  return empresa.id ? atualizarEmpresa(empresa) : criarEmpresa(empresa);
}
