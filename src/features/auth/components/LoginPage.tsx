/**
 * ============================================================================
 * TELA DE LOGIN
 * ============================================================================
 * Mostrada pelo App.tsx sempre que não há sessão ativa. Usuário é criado
 * direto no painel do Supabase (Authentication > Users) — aqui só faz login.
 */

import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Rodape } from '@/shared/components/Rodape';

export function LoginPage() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function handleEntrar() {
    if (!email.trim() || !senha) {
      setErro('Informe e-mail e senha.');
      return;
    }
    setErro(null);
    setEntrando(true);
    try {
      await entrar(email.trim(), senha);
    } catch {
      setErro('E-mail ou senha inválidos.');
    } finally {
      setEntrando(false);
    }
  }

  return (
    <div className="auth-tela">
      <div className="auth-cartao">
        <img src="/logo-transparente.png" alt="Autopeças Morais" className="auth-logo" width={420} height={400} />
        <h1>Entrar</h1>

        <div className="auth-campo">
          <label htmlFor="login-email">E-mail</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEntrar()}
            autoFocus
          />
        </div>

        <div className="auth-campo">
          <label htmlFor="login-senha">Senha</label>
          <input
            id="login-senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEntrar()}
          />
        </div>

        {erro && <span className="auth-erro" aria-live="polite">{erro}</span>}

        <button type="button" className="auth-btn" onClick={handleEntrar} disabled={entrando}>
          <LogIn size={16} aria-hidden="true" /> {entrando ? 'Entrando…' : 'Entrar'}
        </button>
      </div>
      <Rodape />
    </div>
  );
}
