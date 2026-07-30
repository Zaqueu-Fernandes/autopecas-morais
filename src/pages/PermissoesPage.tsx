/**
 * ============================================================================
 * PÁGINA — PERMISSÕES (admin-only)
 * ============================================================================
 * Configura, por OPERADOR individual, quais das 6 ações sensíveis ele pode
 * usar. Admin nunca aparece aqui — sempre tem acesso total (ver useAuth /
 * tem_permissao() no banco). Só visível na navegação pra quem é admin (ver
 * App.tsx), mas a trava de verdade é a RLS de permissoes_usuario (só admin
 * escreve, ver permissoes_usuario.sql) — mesmo que alguém force a URL/estado,
 * o Supabase recusa a escrita.
 */

import { useEffect, useState } from 'react';
import {
  type OperadorComPermissoes,
  CHAVES_PERMISSAO,
  ROTULO_PERMISSAO,
  listarOperadoresComPermissoes,
  definirPermissao,
} from '@/features/permissoes';

export function PermissoesPage() {
  const [operadores, setOperadores] = useState<OperadorComPermissoes[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvandoChave, setSalvandoChave] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setOperadores(await listarOperadoresComPermissoes());
    } catch {
      setErro('Não foi possível carregar os operadores.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleAlternar(operadorId: string, chave: (typeof CHAVES_PERMISSAO)[number], atual: boolean) {
    const chaveEstado = `${operadorId}:${chave}`;
    setSalvandoChave(chaveEstado);
    // Otimista: já reflete na tela, reverte se der erro.
    setOperadores((lista) =>
      lista.map((op) =>
        op.id === operadorId ? { ...op, permissoes: { ...op.permissoes, [chave]: !atual } } : op,
      ),
    );
    try {
      await definirPermissao(operadorId, chave, !atual);
    } catch {
      setOperadores((lista) =>
        lista.map((op) =>
          op.id === operadorId ? { ...op, permissoes: { ...op.permissoes, [chave]: atual } } : op,
        ),
      );
      setErro('Não foi possível salvar essa permissão — tente de novo.');
    } finally {
      setSalvandoChave(null);
    }
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Permissões</h1>
      </div>

      <p className="perm-intro">
        Controla quais operadores podem usar cada ação sensível. Administradores sempre têm acesso
        total às 6 — esta tela só configura contas com papel "operador".
      </p>

      {carregando && <p aria-live="polite">Carregando…</p>}
      {erro && <p className="perm-erro" aria-live="polite">{erro}</p>}

      {!carregando && !erro && operadores.length === 0 && (
        <p>Nenhum operador cadastrado ainda — só existem contas admin.</p>
      )}

      {!carregando && !erro && operadores.length > 0 && (
        <div className="pg-tabela-wrap">
          <table className="pg-tabela perm-tabela">
            <thead>
              <tr>
                <th>Operador</th>
                {CHAVES_PERMISSAO.map((chave) => (
                  <th key={chave}>{ROTULO_PERMISSAO[chave]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {operadores.map((op) => (
                <tr key={op.id} className={!op.ativo ? 'dsp-linha-inativa' : ''}>
                  <td className="pg-tabela-truncar">
                    {op.nome}
                    {!op.ativo && <span className="dsp-tag-inativa">Inativo</span>}
                  </td>
                  {CHAVES_PERMISSAO.map((chave) => {
                    const chaveEstado = `${op.id}:${chave}`;
                    return (
                      <td key={chave} className="perm-celula-check">
                        <input
                          type="checkbox"
                          checked={op.permissoes[chave]}
                          disabled={salvandoChave === chaveEstado}
                          onChange={() => handleAlternar(op.id, chave, op.permissoes[chave])}
                          aria-label={`${ROTULO_PERMISSAO[chave]} — ${op.nome}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
