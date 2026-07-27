/**
 * ============================================================================
 * ACESSO AO BANCO — CONFIGURAÇÃO DA EMPRESA
 * ============================================================================
 * Único lugar que fala com a tabela `empresa_config`. Singleton: sempre lê/
 * atualiza a primeira (e única) linha. Se não existir nenhuma, cria na
 * primeira vez que a tela salvar (ver DashboardPage).
 */

import { supabase } from '@/lib/supabase';
import type { ConfigEmpresa, RegimeTributario } from '../types';

interface LinhaEmpresaConfig {
  id: string;
  regime: RegimeTributario;
  limite_anual_mei: number;
  nome_fantasia: string | null;
}

function linhaParaConfig(l: LinhaEmpresaConfig): ConfigEmpresa {
  return {
    id: l.id,
    regime: l.regime,
    limiteAnualMei: String(l.limite_anual_mei),
    nomeFantasia: l.nome_fantasia ?? '',
  };
}

/** Devolve a configuração da empresa, ou null se ainda não foi configurada. */
export async function buscarConfigEmpresa(): Promise<ConfigEmpresa | null> {
  const { data, error } = await supabase.from('empresa_config').select('*').limit(1).maybeSingle();
  if (error) throw error;
  return data ? linhaParaConfig(data as LinhaEmpresaConfig) : null;
}

/** Cria a configuração (primeira vez) ou atualiza a existente. */
export async function salvarConfigEmpresa(c: ConfigEmpresa): Promise<ConfigEmpresa> {
  const payload = {
    regime: c.regime,
    limite_anual_mei: Number(c.limiteAnualMei),
    nome_fantasia: c.nomeFantasia,
  };

  if (c.id) {
    const { data, error } = await supabase
      .from('empresa_config')
      .update(payload)
      .eq('id', c.id)
      .select()
      .single();
    if (error) throw error;
    return linhaParaConfig(data as LinhaEmpresaConfig);
  }

  const { data, error } = await supabase.from('empresa_config').insert(payload).select().single();
  if (error) throw error;
  return linhaParaConfig(data as LinhaEmpresaConfig);
}
