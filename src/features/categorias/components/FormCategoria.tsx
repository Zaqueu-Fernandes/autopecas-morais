/**
 * ============================================================================
 * FORMULÁRIO DE CATEGORIA (de despesa / conta a pagar)
 * ============================================================================
 * Só pede o nome — a chave (o que fica gravado nas despesas/lançamentos) é
 * gerada automaticamente a partir dele na criação e nunca muda depois,
 * mesmo que o nome seja editado (ver gerarChaveCategoria em ../types).
 * Reaproveita as classes .dsp-* de despesas.css (mesmo estilo de formulário,
 * sem CSS próprio pra essa feature pequena).
 */

import { useState } from 'react';
import { validarNomeCategoria, semErros, type ErrosValidacao } from '../types';

interface Props {
  nomeInicial?: string;
  protegida?: boolean;
  onSalvar: (nome: string) => Promise<void> | void;
  onCancelar?: () => void;
}

export function FormCategoria({ nomeInicial, protegida, onSalvar, onCancelar }: Props) {
  const [nome, setNome] = useState(nomeInicial ?? '');
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSalvar() {
    const e = validarNomeCategoria(nome);
    setErros(e);
    if (!semErros(e)) {
      document.getElementById('categoria-nome')?.focus();
      return;
    }
    setErroSalvar(null);
    setSalvando(true);
    try {
      await onSalvar(nome);
    } catch (erro) {
      setErroSalvar(erro instanceof Error ? erro.message : 'Não foi possível salvar a categoria.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="dsp-form">
      <div className="dsp-form-head">
        <h2>{nomeInicial ? 'Editar categoria' : 'Nova categoria'}</h2>
      </div>

      <div className="dsp-campo">
        <label htmlFor="categoria-nome">Nome *</label>
        <input
          id="categoria-nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: manutenção de veículos, marketing…"
          aria-invalid={!!erros.nome}
          autoFocus
        />
        {erros.nome && <span className="dsp-erro">{erros.nome}</span>}
        {protegida && (
          <span className="dsp-dica">
            Categoria padrão do sistema — dá pra renomear, mas não pra desativar ou excluir.
          </span>
        )}
      </div>

      {erroSalvar && <p className="dsp-erro" aria-live="polite">{erroSalvar}</p>}

      <div className="dsp-acoes">
        {onCancelar && (
          <button type="button" className="dsp-btn-sec" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="button" className="dsp-btn" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar categoria'}
        </button>
      </div>
    </div>
  );
}
