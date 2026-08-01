/**
 * ============================================================================
 * SERVICE — AUTENTICAÇÃO / PERFIS
 * ============================================================================
 */

import { supabase } from '@/lib/supabase';
import type { Perfil } from '../types';

export async function entrar(email: string, senha: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) throw error;
}

export async function sair(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function buscarPerfil(userId: string): Promise<Perfil | null> {
  const { data, error } = await supabase
    .from('perfis')
    .select('id, nome, papel, ativo')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { id: data.id, nome: data.nome, papel: data.papel, ativo: data.ativo };
}

/**
 * Lista TODOS os perfis (admins e operadores) — usado pelo painel admin
 * "Ocultar Pagamentos em Dinheiro" (ver OcultarDinheiroPage.tsx) pra
 * escolher pra quais usuários os lançamentos selecionados ficam ocultos.
 * RLS de `perfis` só deixa ver todo mundo se quem pergunta for admin (ver
 * auth_perfis_rls.sql) — coerente, já que só admin gerencia visibilidade.
 */
export async function listarPerfis(): Promise<Perfil[]> {
  const { data, error } = await supabase.from('perfis').select('id, nome, papel, ativo').order('nome');
  if (error) throw error;
  return data as Perfil[];
}
