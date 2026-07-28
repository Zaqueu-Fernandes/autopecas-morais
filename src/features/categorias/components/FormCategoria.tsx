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
  const [salvando, setSalvando] = useState(false);

  async function handleSalvar() {
    const e = validarNomeCategoria(nome);
    setErros(e);
    if (!semErros(e)) return;
    setSalvando(true);
    try {
      await onSalvar(nome);
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
        <label>Nome *</label>
        <input
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
