/**
 * ============================================================================
 * FORMULÁRIO — QUITAR LANÇAMENTO (marcar como pago/recebido)
 * ============================================================================
 */

import { useState } from 'react';
import {
  type DadosQuitacao,
  type FormaPagamento,
  validarQuitacao,
  semErros,
  ROTULO_FORMA_PAGAMENTO,
  type ErrosValidacao,
} from '../types';

interface Props {
  titulo: string;
  onConfirmar: (formaPagamento: FormaPagamento) => Promise<void> | void;
  onCancelar?: () => void;
}

const FORMAS = Object.keys(ROTULO_FORMA_PAGAMENTO) as FormaPagamento[];

export function FormQuitacao({ titulo, onConfirmar, onCancelar }: Props) {
  const [dados, setDados] = useState<DadosQuitacao>({ formaPagamento: '' });
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [salvando, setSalvando] = useState(false);

  async function handleConfirmar() {
    const e = validarQuitacao(dados);
    setErros(e);
    if (!semErros(e) || !dados.formaPagamento) return;
    setSalvando(true);
    try {
      await onConfirmar(dados.formaPagamento);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fin-form">
      <div className="fin-form-head">
        <h2>{titulo}</h2>
      </div>

      <div className="fin-campo">
        <label>Forma de pagamento *</label>
        <select
          value={dados.formaPagamento}
          onChange={(e) => setDados({ formaPagamento: e.target.value as FormaPagamento })}
          aria-invalid={!!erros.formaPagamento}
          autoFocus
        >
          <option value="">— selecione —</option>
          {FORMAS.map((f) => (
            <option key={f} value={f}>
              {ROTULO_FORMA_PAGAMENTO[f]}
            </option>
          ))}
        </select>
        {erros.formaPagamento && <span className="fin-erro">{erros.formaPagamento}</span>}
      </div>

      <div className="fin-acoes">
        {onCancelar && (
          <button type="button" className="fin-btn-sec" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="button" className="fin-btn" onClick={handleConfirmar} disabled={salvando}>
          {salvando ? 'Confirmando…' : 'Confirmar'}
        </button>
      </div>
    </div>
  );
}
