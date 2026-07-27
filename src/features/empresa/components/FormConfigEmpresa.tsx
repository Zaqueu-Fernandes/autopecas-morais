/**
 * ============================================================================
 * FORMULÁRIO — CONFIGURAÇÃO DA EMPRESA
 * ============================================================================
 * Regime (MEI ↔ ME) é o interruptor central da arquitetura de negócio (ver
 * CLAUDE.md) — migrar de MEI pra ME é só trocar esse campo aqui.
 */

import { useState } from 'react';
import {
  type ConfigEmpresa,
  type RegimeTributario,
  validarConfigEmpresa,
  semErros,
  ROTULO_REGIME,
  type ErrosValidacao,
} from '../types';

interface Props {
  inicial: ConfigEmpresa;
  onSalvar: (c: ConfigEmpresa) => Promise<void> | void;
  onCancelar?: () => void;
}

const REGIMES = Object.keys(ROTULO_REGIME) as RegimeTributario[];

export function FormConfigEmpresa({ inicial, onSalvar, onCancelar }: Props) {
  const [config, setConfig] = useState<ConfigEmpresa>(inicial);
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [salvando, setSalvando] = useState(false);

  function set(patch: Partial<ConfigEmpresa>) {
    setConfig((c) => ({ ...c, ...patch }));
  }

  async function handleSalvar() {
    const e = validarConfigEmpresa(config);
    setErros(e);
    if (!semErros(e)) return;
    setSalvando(true);
    try {
      await onSalvar(config);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="emp-form">
      <div className="emp-form-head">
        <h2>{config.id ? 'Editar configuração da empresa' : 'Configurar empresa'}</h2>
      </div>

      <div className="emp-campo">
        <label>Nome da oficina *</label>
        <input
          value={config.nomeFantasia}
          onChange={(e) => set({ nomeFantasia: e.target.value })}
          aria-invalid={!!erros.nomeFantasia}
          autoFocus
        />
        {erros.nomeFantasia && <span className="emp-erro">{erros.nomeFantasia}</span>}
      </div>

      <div className="emp-campo">
        <label>Regime tributário</label>
        <div className="emp-tipo">
          {REGIMES.map((r) => (
            <button
              key={r}
              type="button"
              className={config.regime === r ? 'ativo' : ''}
              onClick={() => set({ regime: r })}
            >
              {ROTULO_REGIME[r]}
            </button>
          ))}
        </div>
      </div>

      {config.regime === 'MEI' && (
        <div className="emp-campo">
          <label>Limite anual de faturamento MEI (R$) *</label>
          <input
            inputMode="decimal"
            value={config.limiteAnualMei}
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
