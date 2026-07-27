/**
 * ============================================================================
 * FORMULÁRIO — EMPRESA (CNPJ/MEI)
 * ============================================================================
 * Regime (MEI ↔ ME) é o interruptor central da arquitetura de negócio (ver
 * CLAUDE.md) — migrar de MEI pra ME é só trocar esse campo aqui. Cada
 * empresa cadastrada tem seu próprio faturamento monitorado separadamente
 * (ver Dashboard) — útil pra quem opera mais de um CNPJ na mesma oficina.
 */

import { useState } from 'react';
import {
  type Empresa,
  type RegimeTributario,
  validarEmpresa,
  semErros,
  ROTULO_REGIME,
  type ErrosValidacao,
} from '../types';

interface Props {
  inicial: Empresa;
  onSalvar: (e: Empresa) => Promise<void> | void;
  onCancelar?: () => void;
}

const REGIMES = Object.keys(ROTULO_REGIME) as RegimeTributario[];

export function FormEmpresa({ inicial, onSalvar, onCancelar }: Props) {
  const [empresa, setEmpresa] = useState<Empresa>(inicial);
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [salvando, setSalvando] = useState(false);

  function set(patch: Partial<Empresa>) {
    setEmpresa((e) => ({ ...e, ...patch }));
  }

  async function handleSalvar() {
    const e = validarEmpresa(empresa);
    setErros(e);
    if (!semErros(e)) return;
    setSalvando(true);
    try {
      await onSalvar(empresa);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="emp-form">
      <div className="emp-form-head">
        <h2>{empresa.id ? 'Editar empresa' : 'Nova empresa'}</h2>
      </div>

      <div className="emp-campo">
        <label>Nome da empresa *</label>
        <input
          value={empresa.nomeFantasia}
          onChange={(e) => set({ nomeFantasia: e.target.value })}
          aria-invalid={!!erros.nomeFantasia}
          autoFocus
        />
        {erros.nomeFantasia && <span className="emp-erro">{erros.nomeFantasia}</span>}
      </div>

      <div className="emp-campo">
        <label>CNPJ *</label>
        <input
          inputMode="numeric"
          value={empresa.cnpj}
          onChange={(e) => set({ cnpj: e.target.value })}
          placeholder="00.000.000/0001-00"
          aria-invalid={!!erros.cnpj}
        />
        {erros.cnpj && <span className="emp-erro">{erros.cnpj}</span>}
      </div>

      <div className="emp-campo">
        <label>Regime tributário</label>
        <div className="emp-tipo">
          {REGIMES.map((r) => (
            <button
              key={r}
              type="button"
              className={empresa.regime === r ? 'ativo' : ''}
              onClick={() => set({ regime: r })}
            >
              {ROTULO_REGIME[r]}
            </button>
          ))}
        </div>
      </div>

      {empresa.regime === 'MEI' && (
        <div className="emp-campo">
          <label>Limite anual de faturamento MEI (R$) *</label>
          <input
            inputMode="decimal"
            value={empresa.limiteAnualMei}
            onChange={(e) => set({ limiteAnualMei: e.target.value })}
            aria-invalid={!!erros.limiteAnualMei}
          />
          {erros.limiteAnualMei && <span className="emp-erro">{erros.limiteAnualMei}</span>}
          <span className="emp-dica">Hoje o limite legal é R$ 81.000/ano — ajuste aqui se a lei mudar.</span>
        </div>
      )}

      <div className="emp-acoes">
        {onCancelar && (
          <button type="button" className="emp-btn-sec" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="button" className="emp-btn" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
