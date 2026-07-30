/**
 * ============================================================================
 * CONTEXTO DE AUTENTICAÇÃO
 * ============================================================================
 * Envolve o app inteiro (App.tsx). Mantém a sessão do Supabase Auth, o
 * perfil (papel: admin/operador) e as permissões granulares (ver
 * @/features/permissoes) do usuário logado, e expõe entrar()/sair().
 * Enquanto carrega a sessão inicial, `carregando` fica true — quem consome
 * (App.tsx) decide o que mostrar nesse meio tempo.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { entrar, sair, buscarPerfil } from '../services/auth.service';
import type { Perfil } from '../types';
import { buscarMinhasPermissoes } from '@/features/permissoes';
import type { ChavePermissao } from '@/features/permissoes';

interface AuthContextValor {
  sessao: Session | null;
  perfil: Perfil | null;
  carregando: boolean;
  ehAdmin: boolean;
  /**
   * Admin sempre tem todas — este helper é só UX (esconder/desabilitar
   * botão com explicação); a trava de verdade é a RLS (tem_permissao() no
   * banco, ver permissoes_usuario.sql).
   */
  temPermissao: (chave: ChavePermissao) => boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValor | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [permissoes, setPermissoes] = useState<Record<ChavePermissao, boolean>>(
    {} as Record<ChavePermissao, boolean>,
  );
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarPerfilDaSessao(s: Session | null) {
      setSessao(s);
      if (!s) {
        setPerfil(null);
        setPermissoes({} as Record<ChavePermissao, boolean>);
        return;
      }
      try {
        setPerfil(await buscarPerfil(s.user.id));
      } catch {
        setPerfil(null);
      }
      try {
        setPermissoes(await buscarMinhasPermissoes(s.user.id));
      } catch {
        setPermissoes({} as Record<ChavePermissao, boolean>);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      carregarPerfilDaSessao(data.session).finally(() => setCarregando(false));
    });

    const { data: assinatura } = supabase.auth.onAuthStateChange((_evento, s) => {
      carregarPerfilDaSessao(s);
    });

    return () => assinatura.subscription.unsubscribe();
  }, []);

  const ehAdmin = perfil?.papel === 'admin' && perfil.ativo;

  const valor: AuthContextValor = {
    sessao,
    perfil,
    carregando,
    ehAdmin,
    temPermissao: (chave) => ehAdmin || permissoes[chave] === true,
    entrar,
    sair,
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValor {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return ctx;
}
