/**
 * ============================================================================
 * FORMULÁRIO DE CLIENTE
 * ============================================================================
 * Cadastro rápido: só nome e telefone são exigidos por padrão. O endereço
 * completo passa a ser obrigatório quando o cliente é PJ ou quando o cadastro
 * é feito com intenção de emitir nota (prop exigirNota — Fase 3 / ME).
 *
 * Não usa <form> (segue a restrição de Artifacts/React): o envio é por onClick.
 */

import React, { useState } from 'react';
import {
  type Cliente,
  clienteVazio,
  validarCliente,
  semErros,
  type ErrosValidacao,
} from './types';
import { CamposEndereco } from './CamposEndereco';

interface Props {
  inicial?: Cliente;
  /** Fase 3: quando true, exige endereço/documento mesmo para PF. */
  exigirNota?: boolean;
  onSalvar: (c: Cliente) => Promise<void> | void;
  onCancelar?: () => void;
}

export function FormCliente({
  inicial,
  exigirNota = false,
  onSalvar,
  onCancelar,
}: Props) {
  const [cliente, setCliente] = useState<Cliente>(inicial ?? clienteVazio());
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [salvando, setSalvando] = useState(false);

  function set(patch: Partial<Cliente>) {
    setCliente((c) => ({ ...c, ...patch }));
  }

  const ehPJ = cliente.tipoPessoa === 'PJ';
  const enderecoObrigatorio = ehPJ || exigirNota;

  async function handleSalvar() {
    const e = validarCliente(cliente, { exigirNota });
    setErros(e);
    if (!semErros(e)) return;

    setSalvando(true);
    try {
      await onSalvar(cliente);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="cad-form">
      <div className="cad-form-head">
        <h2>{cliente.id ? 'Editar cliente' : 'Novo cliente'}</h2>
        {enderecoObrigatorio && (
          <span className="cad-tag">Endereço completo obrigatório</span>
        )}
      </div>

      {/* Tipo de pessoa */}
      <div className="cad-tipo">
        <button
          type="button"
          className={!ehPJ ? 'ativo' : ''}
          onClick={() => set({ tipoPessoa: 'PF' })}
        >
          Pessoa Física
        </button>
        <button
          type="button"
          className={ehPJ ? 'ativo' : ''}
          onClick={() => set({ tipoPessoa: 'PJ' })}
        >
          Pessoa Jurídica
        </button>
      </div>

      <div className="cad-grid">
        <div className="cad-campo cad-col-2">
          <label>{ehPJ ? 'Razão social / Nome' : 'Nome'} *</label>
          <input
            value={cliente.nome}
            onChange={(e) => set({ nome: e.target.value })}
            aria-invalid={!!erros.nome}
            autoFocus
          />
          {erros.nome && <span className="cad-erro">{erros.nome}</span>}
        </div>

        <div className="cad-campo">
          <label>
            {ehPJ ? 'CNPJ' : 'CPF'}
            {enderecoObrigatorio ? ' *' : ''}
          </label>
          <input
            inputMode="numeric"
            value={cliente.documento}
            placeholder={ehPJ ? '00.000.000/0001-00' : '000.000.000-00'}
            onChange={(e) => set({ documento: e.target.value })}
            aria-invalid={!!erros.documento}
          />
          {erros.documento && <span className="cad-erro">{erros.documento}</span>}
        </div>

        <div className="cad-campo">
          <label>Telefone / WhatsApp *</label>
          <input
            inputMode="tel"
            value={cliente.telefone}
            placeholder="(88) 90000-0000"
            onChange={(e) => set({ telefone: e.target.value })}
            aria-invalid={!!erros.telefone}
          />
          {erros.telefone && <span className="cad-erro">{erros.telefone}</span>}
        </div>

        <div className="cad-campo cad-col-2">
          <label>E-mail {enderecoObrigatorio ? '(útil para enviar a nota)' : ''}</label>
          <input
            inputMode="email"
            value={cliente.email}
            onChange={(e) => set({ email: e.target.value })}
          />
        </div>
      </div>

      <CamposEndereco valor={cliente} onChange={set} erros={erros} />

      <div className="cad-campo">
        <label>Observações</label>
        <textarea
          rows={2}
          value={cliente.observacoes}
          onChange={(e) => set({ observacoes: e.target.value })}
          placeholder="Ex.: cliente antigo, referência de outro cliente…"
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
          {salvando ? 'Salvando…' : 'Salvar cliente'}
        </button>
      </div>
    </div>
  );
}
