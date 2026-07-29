/**
 * ============================================================================
 * FORMULÁRIO — QUITAR LANÇAMENTO (marcar como pago/recebido)
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import {
  type DadosQuitacao,
  type FormaPagamento,
  dadosQuitacaoVazio,
  validarQuitacao,
  semErros,
  ROTULO_FORMA_PAGAMENTO,
  type ErrosValidacao,
} from '../types';
import { type Empresa, listarEmpresas } from '@/features/empresa';
import { type ContaFinanceira, listarContasFinanceiras, ROTULO_TIPO_CONTA } from '@/features/contas-financeiras';

interface Props {
  titulo: string;
  /** true = este lançamento ainda não tem empresa (veio de despesa recorrente global) — exige escolher agora. */
  precisaEmpresa?: boolean;
  onConfirmar: (formaPagamento: FormaPagamento, contaFinanceiraId: string, empresaId?: string) => Promise<void> | void;
  onCancelar?: () => void;
}

const FORMAS = Object.keys(ROTULO_FORMA_PAGAMENTO) as FormaPagamento[];

export function FormQuitacao({ titulo, precisaEmpresa = false, onConfirmar, onCancelar }: Props) {
  const [dados, setDados] = useState<DadosQuitacao>(dadosQuitacaoVazio());
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [contas, setContas] = useState<ContaFinanceira[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  function set(patch: Partial<DadosQuitacao>) {
    setDados((d) => ({ ...d, ...patch }));
  }

  useEffect(() => {
    listarContasFinanceiras().then(setContas).catch(() => setContas([]));
    if (precisaEmpresa) {
      listarEmpresas().then((lista) => {
        setEmpresas(lista);
        if (lista.length === 1) set({ empresaId: lista[0].id });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [precisaEmpresa]);

  async function handleConfirmar() {
    const e = validarQuitacao(dados, precisaEmpresa);
    setErros(e);
    if (!semErros(e) || !dados.formaPagamento || !dados.contaFinanceiraId) return;
    setErroSalvar(null);
    setSalvando(true);
    try {
      await onConfirmar(dados.formaPagamento, dados.contaFinanceiraId, precisaEmpresa ? dados.empresaId : undefined);
    } catch (erro) {
      setErroSalvar(erro instanceof Error ? erro.message : 'Não foi possível confirmar esta quitação.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fin-form">
      <div className="fin-form-head">
        <h2>{titulo}</h2>
      </div>

      {precisaEmpresa && (
        <div className="fin-campo">
          <label htmlFor="qt-empresa">Empresa *</label>
          <select
            id="qt-empresa"
            value={dados.empresaId}
            onChange={(e) => set({ empresaId: e.target.value })}
            aria-invalid={!!erros.empresaId}
            autoFocus
          >
            <option value="">— selecione —</option>
            {empresas.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nomeFantasia}
              </option>
            ))}
          </select>
          {erros.empresaId && (
            <span className="fin-erro" aria-live="polite">
              {erros.empresaId}
            </span>
          )}
          <span className="fin-aviso">
            Essa conta foi gerada de uma despesa recorrente sem empresa definida — informe agora qual empresa
            está pagando de verdade.
          </span>
        </div>
      )}

      <div className="fin-campo">
        <label htmlFor="qt-forma">Forma de pagamento *</label>
        <select
          id="qt-forma"
          value={dados.formaPagamento}
          onChange={(e) => set({ formaPagamento: e.target.value as FormaPagamento })}
          aria-invalid={!!erros.formaPagamento}
          autoFocus={!precisaEmpresa}
        >
          <option value="">— selecione —</option>
          {FORMAS.map((f) => (
            <option key={f} value={f}>
              {ROTULO_FORMA_PAGAMENTO[f]}
            </option>
          ))}
        </select>
        {erros.formaPagamento && (
          <span className="fin-erro" aria-live="polite">
            {erros.formaPagamento}
          </span>
        )}
      </div>

      <div className="fin-campo">
        <label htmlFor="qt-conta">Conta *</label>
        <select
          id="qt-conta"
          value={dados.contaFinanceiraId}
          onChange={(e) => set({ contaFinanceiraId: e.target.value })}
          aria-invalid={!!erros.contaFinanceiraId}
        >
          <option value="">— selecione —</option>
          {contas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.instituicao} ({ROTULO_TIPO_CONTA[c.tipo]})
            </option>
          ))}
        </select>
        {erros.contaFinanceiraId && (
          <span className="fin-erro" aria-live="polite">
            {erros.contaFinanceiraId}
          </span>
        )}
        {contas.length === 0 && (
          <span className="fin-aviso">Cadastre uma conta financeira em Cadastros antes de continuar.</span>
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
          {salvando ? 'Confirmando…' : 'Confirmar'}
        </button>
      </div>
    </div>
  );
}
