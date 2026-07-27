/**
 * ============================================================================
 * FORMULÁRIO DE FORNECEDOR
 * ============================================================================
 * Mais enxuto que o de cliente. Endereço é opcional aqui — na prática ele
 * costuma vir preenchido automaticamente pelo XML da NF-e de entrada (futuro).
 */

import React, { useState } from 'react';
import {
  type Fornecedor,
  fornecedorVazio,
  validarFornecedor,
  semErros,
  type ErrosValidacao,
} from '../types';
import { CamposEndereco } from './CamposEndereco';

interface Props {
  inicial?: Fornecedor;
  onSalvar: (f: Fornecedor) => Promise<void> | void;
  onCancelar?: () => void;
}

export function FormFornecedor({ inicial, onSalvar, onCancelar }: Props) {
  const [forn, setForn] = useState<Fornecedor>(inicial ?? fornecedorVazio());
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [salvando, setSalvando] = useState(false);

  function set(patch: Partial<Fornecedor>) {
    setForn((f) => ({ ...f, ...patch }));
  }

  async function handleSalvar() {
    const e = validarFornecedor(forn);
    setErros(e);
    if (!semErros(e)) return;
    setSalvando(true);
    try {
      await onSalvar(forn);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="cad-form">
      <div className="cad-form-head">
        <h2>{forn.id ? 'Editar fornecedor' : 'Novo fornecedor'}</h2>
      </div>

      <div className="cad-grid">
        <div className="cad-campo cad-col-2">
          <label>Nome / Razão social *</label>
          <input
            value={forn.nome}
            onChange={(e) => set({ nome: e.target.value })}
            aria-invalid={!!erros.nome}
            autoFocus
          />
          {erros.nome && <span className="cad-erro">{erros.nome}</span>}
        </div>

        <div className="cad-campo">
          <label>CNPJ</label>
          <input
            inputMode="numeric"
            value={forn.cnpj}
            placeholder="00.000.000/0001-00"
            onChange={(e) => set({ cnpj: e.target.value })}
          />
        </div>

        <div className="cad-campo">
          <label>Telefone</label>
          <input
            inputMode="tel"
            value={forn.telefone}
            placeholder="(88) 90000-0000"
            onChange={(e) => set({ telefone: e.target.value })}
            aria-invalid={!!erros.telefone}
          />
          {erros.telefone && <span className="cad-erro">{erros.telefone}</span>}
        </div>

        <div className="cad-campo cad-col-2">
          <label>E-mail</label>
          <input
            inputMode="email"
            value={forn.email}
            onChange={(e) => set({ email: e.target.value })}
          />
        </div>
      </div>

      <CamposEndereco valor={forn} onChange={set} erros={erros} />

      <div className="cad-campo">
        <label>Observações</label>
        <textarea
          rows={2}
          value={forn.observacoes}
          onChange={(e) => set({ observacoes: e.target.value })}
          placeholder="Ex.: prazo de entrega, condição de pagamento…"
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
          {salvando ? 'Salvando…' : 'Salvar fornecedor'}
        </button>
      </div>
    </div>
  );
}
