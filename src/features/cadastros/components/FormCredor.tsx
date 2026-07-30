/**
 * ============================================================================
 * FORMULÁRIO DE CREDOR
 * ============================================================================
 * Mesmo padrão de FormFornecedor. `documento` é genérico (CPF ou CNPJ) —
 * credor pode ser pessoa física (ex.: quem recebe retirada de lucro) ou
 * jurídica (ex.: concessionária de energia).
 */

import { useState } from 'react';
import {
  type Credor,
  credorVazio,
  validarCredor,
  semErros,
  type ErrosValidacao,
} from '../types';
import { CamposEndereco } from './CamposEndereco';

interface Props {
  inicial?: Credor;
  onSalvar: (c: Credor) => Promise<void> | void;
  onCancelar?: () => void;
}

export function FormCredor({ inicial, onSalvar, onCancelar }: Props) {
  const [credor, setCredor] = useState<Credor>(inicial ?? credorVazio());
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [salvando, setSalvando] = useState(false);

  function set(patch: Partial<Credor>) {
    setCredor((c) => ({ ...c, ...patch }));
  }

  async function handleSalvar() {
    const e = validarCredor(credor);
    setErros(e);
    if (!semErros(e)) {
      document.getElementById('credor-nome')?.focus();
      return;
    }
    setSalvando(true);
    try {
      await onSalvar(credor);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="cad-form">
      <div className="cad-form-head">
        <h2>{credor.id ? 'Editar credor' : 'Novo credor'}</h2>
      </div>

      <div className="cad-grid">
        <div className="cad-campo cad-col-2">
          <label htmlFor="credor-nome">Nome *</label>
          <input
            id="credor-nome"
            value={credor.nome}
            onChange={(e) => set({ nome: e.target.value })}
            aria-invalid={!!erros.nome}
            autoFocus
          />
          {erros.nome && <span className="cad-erro">{erros.nome}</span>}
        </div>

        <div className="cad-campo">
          <label htmlFor="credor-documento">CPF / CNPJ</label>
          <input
            id="credor-documento"
            inputMode="numeric"
            spellCheck={false}
            value={credor.documento}
            placeholder="Opcional"
            onChange={(e) => set({ documento: e.target.value })}
          />
        </div>

        <div className="cad-campo">
          <label htmlFor="credor-telefone">Telefone</label>
          <input
            id="credor-telefone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={credor.telefone}
            placeholder="(88) 90000-0000"
            onChange={(e) => set({ telefone: e.target.value })}
          />
        </div>

        <div className="cad-campo cad-col-2">
          <label htmlFor="credor-email">E-mail</label>
          <input
            id="credor-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={credor.email}
            onChange={(e) => set({ email: e.target.value })}
          />
        </div>
      </div>

      <CamposEndereco valor={credor} onChange={set} erros={erros} />

      <div className="cad-campo">
        <label htmlFor="credor-observacoes">Observações</label>
        <textarea
          id="credor-observacoes"
          rows={2}
          value={credor.observacoes}
          onChange={(e) => set({ observacoes: e.target.value })}
          placeholder="Ex.: contrato, dia de vencimento…"
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
          {salvando ? 'Salvando…' : 'Salvar credor'}
        </button>
      </div>
    </div>
  );
}
