/**
 * ============================================================================
 * ACESSO AO BANCO — PERMISSÕES GRANULARES POR USUÁRIO
 * ============================================================================
 * Único lugar que fala com `permissoes_usuario` (e lê `perfis` pra listar os
 * operadores). Componentes usam essas funções, nunca o Supabase direto (ver
 * regra em CLAUDE.md). A trava de verdade é a RLS (só admin escreve aqui,
 * ver permissoes_usuario.sql) — este service não reforça isso, só reflete.
 */

import { supabase } from '@/lib/supabase';
import { CHAVES_PERMISSAO, type ChavePermissao, type OperadorComPermissoes } from '../types';

interface LinhaPerfil {
  id: string;
  nome: string;
  ativo: boolean;
}

interface LinhaPermissao {
  usuario_id: string;
  chave: ChavePermissao;
  permitido: boolean;
}

/** Lista todos os operadores (papel='operador', qualquer status ativo) com o mapa das 6 permissões. */
export async function listarOperadoresComPermissoes(): Promise<OperadorComPermissoes[]> {
  const { data: perfis, error: erroPerfis } = await supabase
    .from('perfis')
    .select('id, nome, ativo')
    .eq('papel', 'operador')
    .order('nome');
  if (erroPerfis) throw erroPerfis;

  const { data: permissoes, error: erroPermissoes } = await supabase
    .from('permissoes_usuario')
    .select('usuario_id, chave, permitido');
  if (erroPermissoes) throw erroPermissoes;

  return (perfis as LinhaPerfil[]).map((p) => {
    const mapa = {} as Record<ChavePermissao, boolean>;
    for (const chave of CHAVES_PERMISSAO) {
      const linha = (permissoes as LinhaPermissao[]).find((pm) => pm.usuario_id === p.id && pm.chave === chave);
      mapa[chave] = linha?.permitido ?? false;
    }
    return { id: p.id, nome: p.nome, ativo: p.ativo, permissoes: mapa };
  });
}

/** Liga/desliga uma permissão pra um usuário — salva imediato (sem botão "Salvar" separado). */
export async function definirPermissao(
  usuarioId: string,
  chave: ChavePermissao,
  permitido: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('permissoes_usuario')
    .upsert({ usuario_id: usuarioId, chave, permitido }, { onConflict: 'usuario_id,chave' });
  if (error) throw error;
}

/** Busca só as permissões do usuário logado — usado pelo useAuth pra montar temPermissao(). */
export async function buscarMinhasPermissoes(usuarioId: string): Promise<Record<ChavePermissao, boolean>> {
  const { data, error } = await supabase
    .from('permissoes_usuario')
    .select('chave, permitido')
    .eq('usuario_id', usuarioId);
  if (error) throw error;

  const mapa = {} as Record<ChavePermissao, boolean>;
  for (const chave of CHAVES_PERMISSAO) {
    mapa[chave] = (data as Array<{ chave: ChavePermissao; permitido: boolean }>).find((r) => r.chave === chave)?.permitido ?? false;
  }
  return mapa;
}
