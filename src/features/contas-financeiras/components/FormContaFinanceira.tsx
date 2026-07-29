/**
 * ============================================================================
 * FORMULÁRIO DE CONTA FINANCEIRA
 * ============================================================================
 * Cadastro simples: tipo (banco/carteira/cartão/investimento) + instituição
 * (nome do banco, ou uma label livre pra carteira/maquineta). Reaproveita as
 * classes .dsp-* de despesas.css (mesmo estilo, sem CSS próprio pra essa
 * feature pequena).
 */

import { useState } from 'react';
import {
  type ContaFinanceira,
  type TipoContaFinanceira,
  contaFinanceiraVazia,
  validarContaFinanceira,
  semErros,
  ROTULO_TIPO_CONTA,
  type ErrosValidacao,
} from '../types';

interface Props {
  inicial?: ContaFinanceira;
  onSalvar: (c: ContaFinanceira) => Promise<void> | void;
  onCancelar?: () => void;
}

const TIPOS = Object.keys(ROTULO_TIPO_CONTA) as TipoContaFinanceira[];

export function FormContaFinanceira({ inicial, onSalvar, onCancelar }: Props) {
  const [conta, setConta] = useState<ContaFinanceira>(inicial ?? contaFinanceiraVazia());
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function set(patch: Partial<ContaFinanceira>) {
    setConta((c) => ({ ...c, ...patch }));
  }

  async function handleSalvar() {
    const e = validarContaFinanceira(conta);
    setErros(e);
    if (!semErros(e)) {
      document.getElementById(e.tipo ? 'conta-tipo' : 'conta-instituicao')?.focus();
      return;
    }
    setErroSalvar(null);
    setSalvando(true);
    try {
      await onSalvar(conta);
    } catch (erro) {
      setErroSalvar(erro instanceof Error ? erro.message : 'Não foi possível salvar esta conta.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="dsp-form">
      <div className="dsp-form-head">
        <h2>{conta.id ? 'Editar conta financeira' : 'Nova conta financeira'}</h2>
      </div>

      <div className="dsp-grid">
        <div className="dsp-campo">
          <label htmlFor="conta-tipo">Tipo *</label>
          <select
            id="conta-tipo"
            name="tipo"
            autoComplete="off"
            value={conta.tipo}
            onChange={(e) => set({ tipo: e.target.value as TipoContaFinanceira })}
            aria-invalid={!!erros.tipo}
          >
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {ROTULO_TIPO_CONTA[t]}
              </option>
            ))}
          </select>
          {erros.tipo && (
            <span className="dsp-erro" aria-live="polite">
              {erros.tipo}
            </span>
          )}
        </div>

        <div className="dsp-campo">
          <label htmlFor="conta-instituicao">Instituição *</label>
          <input
            id="conta-instituicao"
            name="instituicao"
            autoComplete="off"
            value={conta.instituicao}
            onChange={(e) => set({ instituicao: e.target.value })}
            placeholder="Ex.: Banco do Brasil, Stone, Caixa da loja…"
            aria-invalid={!!erros.instituicao}
            autoFocus
          />
          {erros.instituicao && (
            <span className="dsp-erro" aria-live="polite">
              {erros.instituicao}
            </span>
          )}
        </div>
      </div>

      {erroSalvar && (
        <p className="dsp-erro" aria-live="polite">
          {erroSalvar}
        </p>
      )}

      <div className="dsp-acoes">
        {onCancelar && (
          <button type="button" className="dsp-btn-sec" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="button" className="dsp-btn" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar conta'}
        </button>
      </div>
    </div>
  );
}
