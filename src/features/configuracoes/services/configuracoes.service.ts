/**
 * ============================================================================
 * ACESSO AO BANCO — CONFIGURAÇÕES DO SISTEMA
 * ============================================================================
 * Único lugar que fala com `configuracoes_sistema` — tabela chave/valor
 * genérica pra ajustes globais editáveis pelo admin (ver
 * configuracoes_sistema.sql). Leitura liberada pra qualquer usuário logado;
 * escrita só admin (RLS, não validado aqui).
 */

import { supabase } from '@/lib/supabase';

/** Chave da URL do serviço externo de consulta de NF-e por chave de acesso — botão "Baixar XML de Nota Fiscal" em Estoque. */
export const CHAVE_URL_XML_NFE = 'url_baixar_xml_nfe';

/** `null` = configuração ainda não foi cadastrada. */
export async function buscarConfiguracao(chave: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('configuracoes_sistema')
    .select('valor')
    .eq('chave', chave)
    .maybeSingle();
  if (error) throw error;
  return data?.valor ?? null;
}

/** Upsert — cria a linha se ainda não existir, ou substitui o valor se já existir. */
export async function salvarConfiguracao(chave: string, valor: string): Promise<void> {
  const { error } = await supabase
    .from('configuracoes_sistema')
    .upsert({ chave, valor }, { onConflict: 'chave' });
  if (error) throw error;
}
