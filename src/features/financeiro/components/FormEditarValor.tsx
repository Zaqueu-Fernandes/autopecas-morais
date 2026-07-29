/**
 * ============================================================================
 * FORMULÁRIO — EDITAR VALOR DE UM LANÇAMENTO PENDENTE
 * ============================================================================
 * Corrige o valor pro que está sendo pago/recebido de verdade — útil pra
 * contas de despesa variável (água, luz...), geradas com um valor médio
 * estimado. Só faz sentido em lançamentos ainda não quitados.
 */

import { useState } from 'react';

interface Props {
  descricao: string;
  valorAtual: number;
  onConfirmar: (novoValor: number) => Promise<void> | void;
  onCancelar?: () => void;
}

export function FormEditarValor({ descricao, valorAtual, onConfirmar, onCancelar }: Props) {
  const [valor, setValor] = useState(String(valorAtual));
  const [erro, setErro] = useState('');
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleConfirmar() {
    const numero = Number(valor);
    if (!valor.trim() || Number.isNaN(numero) || numero <= 0) {
      setErro('Informe um valor maior que zero.');
      return;
    }
    setErro('');
    setErroSalvar(null);
    setSalvando(true);
    try {
      await onConfirmar(numero);
    } catch (erro) {
      setErroSalvar(erro instanceof Error ? erro.message : 'Não foi possível salvar este valor.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fin-form">
      <div className="fin-form-head">
        <h2>Editar valor</h2>
      </div>

      <p className="fin-aviso">{descricao}</p>

      <div className="fin-campo">
        <label htmlFor="ev-valor">Valor (R$) *</label>
        <input
          id="ev-valor"
          inputMode="decimal"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="0,00"
          aria-invalid={!!erro}
          autoFocus
        />
        {erro && (
          <span className="fin-erro" aria-live="polite">
            {erro}
          </span>
        )}
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
          {salvando ? 'Salvando…' : 'Salvar valor'}
        </button>
      </div>
    </div>
  );
}
