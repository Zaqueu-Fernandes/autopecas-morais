/**
 * ============================================================================
 * CONTEXTO DE AUTENTICAÇÃO
 * ============================================================================
 * Envolve o app inteiro (App.tsx). Mantém a sessão do Supabase Auth e o
 * perfil (papel: admin/operador) do usuário logado, e expõe entrar()/sair().
 * Enquanto carrega a sessão inicial, `carregando` fica true — quem consome
 * (App.tsx) decide o que mostrar nesse meio tempo.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { entrar, sair, buscarPerfil } from '../services/auth.service';
import type { Perfil } from '../types';

interface AuthContextValor {
  sessao: Session | null;
  perfil: Perfil | null;
  carregando: boolean;
  ehAdmin: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValor | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarPerfilDaSessao(s: Session | null) {
      setSessao(s);
      if (!s) {
        setPerfil(null);
        return;
      }
      try {
        setPerfil(await buscarPerfil(s.user.id));
      } catch {
        setPerfil(null);
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

  const valor: AuthContextValor = {
    sessao,
    perfil,
    carregando,
    ehAdmin: perfil?.papel === 'admin' && perfil.ativo,
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
