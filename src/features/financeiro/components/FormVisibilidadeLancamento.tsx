/**
 * ============================================================================
 * FORMULÁRIO — VISIBILIDADE DE LANÇAMENTO (OCULTAR EM DINHEIRO)
 * ============================================================================
 * Só admin abre esta tela (ver FinanceiroPage). Lista todos os perfis
 * (admins e operadores, o próprio admin logado incluso) com uma checkbox
 * cada — marcar um usuário faz o lançamento sumir de listas, somatórios
 * (Dashboard, Fluxo de Caixa) e relatórios impressos/PDF PRA ELE, como se
 * não existisse. É reversível a qualquer momento, reabrindo esta tela e
 * desmarcando.
 */

import { useState } from 'react';
import type { Perfil } from '@/features/auth';

interface Props {
  descricao: string;
  perfis: Perfil[];
  /** ids de usuário que hoje já ocultam este lançamento — pré-marca as checkboxes. */
  selecionadosIniciais: string[];
  /** id do admin logado — só pra deixar claro na tela quando ele está ocultando de si mesmo. */
  meuId?: string;
  onConfirmar: (usuarioIds: string[]) => Promise<void> | void;
  onCancelar?: () => void;
}

export function FormVisibilidadeLancamento({
  descricao,
  perfis,
  selecionadosIniciais,
  meuId,
  onConfirmar,
  onCancelar,
}: Props) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set(selecionadosIniciais));
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function alternar(id: string, marcado: boolean) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (marcado) novo.add(id);
      else novo.delete(id);
      return novo;
    });
  }

  async function handleConfirmar() {
    setErroSalvar(null);
    setSalvando(true);
    try {
      await onConfirmar(Array.from(selecionados));
    } catch (erro) {
      setErroSalvar(erro instanceof Error ? erro.message : 'Não foi possível salvar a visibilidade deste lançamento.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fin-form">
      <div className="fin-form-head">
        <h2>Ocultar de quem?</h2>
      </div>

      <p className="fin-aviso">{descricao}</p>
      <p className="fin-aviso">
        Marque os usuários pra quem este lançamento deve sumir — listas, somatórios (Dashboard, Fluxo de
        Caixa) e relatórios impressos/PDF passam a ignorar o valor pra cada um marcado, como se o
        lançamento não existisse. Desmarcar reverte na hora. Dá pra incluir você mesmo.
      </p>

      <div className="fin-checklist">
        {perfis.map((p) => (
          <label key={p.id} className="fin-checklist-item">
            <input
              type="checkbox"
              checked={selecionados.has(p.id)}
              onChange={(e) => alternar(p.id, e.target.checked)}
            />
            <span>
              {p.nome}
              {p.id === meuId && ' (você)'}
            </span>
            <span className="fin-checklist-papel">{p.papel === 'admin' ? 'Admin' : 'Operador'}</span>
          </label>
        ))}
        {perfis.length === 0 && <p>Nenhum usuário cadastrado.</p>}
      </div>

      {erroSalvar && (
        <p className="fin-erro" aria-live="polite">
          {erroSalvar}
        </p>
      )}

      <div className="fin-acoes">
        {onCancelar && (
          <button type="button" className="fin-btn-sec" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="button" className="fin-btn" onClick={handleConfirmar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar visibilidade'}
        </button>
      </div>
    </div>
  );
}
