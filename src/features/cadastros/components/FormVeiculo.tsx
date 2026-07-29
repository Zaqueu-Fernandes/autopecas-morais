/**
 * ============================================================================
 * FORMULÁRIO DE VEÍCULO
 * ============================================================================
 * Sempre vinculado a um cliente (clienteId vem de quem usa este componente).
 * Só a placa é obrigatória — o resto ajuda a identificar o veículo na oficina.
 */

import { useState } from 'react';
import {
  type Veiculo,
  veiculoVazio,
  validarVeiculo,
  semErros,
  type ErrosValidacao,
} from '../types';

interface Props {
  clienteId: string;
  inicial?: Veiculo;
  onSalvar: (v: Veiculo) => Promise<void> | void;
  onCancelar?: () => void;
}

export function FormVeiculo({ clienteId, inicial, onSalvar, onCancelar }: Props) {
  const [veiculo, setVeiculo] = useState<Veiculo>(inicial ?? veiculoVazio(clienteId));
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [salvando, setSalvando] = useState(false);

  function set(patch: Partial<Veiculo>) {
    setVeiculo((v) => ({ ...v, ...patch }));
  }

  // Ordem visual dos campos — usada só pra decidir qual foco levar o usuário
  // quando a validação falha.
  const ORDEM_CAMPOS = ['placa', 'ano'];

  async function handleSalvar() {
    const e = validarVeiculo(veiculo);
    setErros(e);
    if (!semErros(e)) {
      const primeiraChave = ORDEM_CAMPOS.find((campo) => e[campo]);
      if (primeiraChave) document.getElementById(`veiculo-${primeiraChave}`)?.focus();
      return;
    }

    setSalvando(true);
    try {
      await onSalvar(veiculo);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="cad-form">
      <div className="cad-form-head">
        <h2>{veiculo.id ? 'Editar veículo' : 'Novo veículo'}</h2>
      </div>

      <div className="cad-grid">
        <div className="cad-campo">
          <label htmlFor="veiculo-placa">Placa *</label>
          <input
            id="veiculo-placa"
            spellCheck={false}
            value={veiculo.placa}
            onChange={(e) => set({ placa: e.target.value })}
            placeholder="ABC1D23"
            aria-invalid={!!erros.placa}
            autoFocus
          />
          {erros.placa && <span className="cad-erro">{erros.placa}</span>}
        </div>

        <div className="cad-campo">
          <label htmlFor="veiculo-ano">Ano</label>
          <input
            id="veiculo-ano"
            inputMode="numeric"
            value={veiculo.ano}
            onChange={(e) => set({ ano: e.target.value })}
            placeholder="2018"
            aria-invalid={!!erros.ano}
          />
          {erros.ano && <span className="cad-erro">{erros.ano}</span>}
        </div>

        <div className="cad-campo">
          <label htmlFor="veiculo-marca">Marca</label>
          <input
            id="veiculo-marca"
            value={veiculo.marca}
            onChange={(e) => set({ marca: e.target.value })}
            placeholder="Fiat, Chevrolet…"
          />
        </div>

        <div className="cad-campo">
          <label htmlFor="veiculo-modelo">Modelo</label>
          <input
            id="veiculo-modelo"
            value={veiculo.modelo}
            onChange={(e) => set({ modelo: e.target.value })}
            placeholder="Uno, Onix…"
          />
        </div>

        <div className="cad-campo">
          <label htmlFor="veiculo-cor">Cor</label>
          <input
            id="veiculo-cor"
            value={veiculo.cor}
            onChange={(e) => set({ cor: e.target.value })}
          />
        </div>

        <div className="cad-campo">
          <label htmlFor="veiculo-quilometragem">Quilometragem</label>
          <input
            id="veiculo-quilometragem"
            inputMode="numeric"
            value={veiculo.quilometragem}
            onChange={(e) => set({ quilometragem: e.target.value })}
            placeholder="80000"
          />
        </div>
      </div>

      <div className="cad-campo">
        <label htmlFor="veiculo-observacoes">Observações</label>
        <textarea
          id="veiculo-observacoes"
          rows={2}
          value={veiculo.observacoes}
          onChange={(e) => set({ observacoes: e.target.value })}
          placeholder="Ex.: barulho na suspensão dianteira…"
        />
      </div>

      <div className="cad-acoes">
        {onCancelar && (
          <button type="button" className="cad-btn-sec" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button
          type="button"
          className="cad-btn"
          onClick={handleSalvar}
          disabled={salvando}
        >
          {salvando ? 'Salvando…' : 'Salvar veículo'}
        </button>
      </div>
    </div>
  );
}
