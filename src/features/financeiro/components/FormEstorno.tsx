/**
 * ============================================================================
 * FORMULÁRIO — ESTORNAR LANÇAMENTO
 * ============================================================================
 * Pede o motivo sempre; a forma de pagamento da devolução só aparece quando
 * o lançamento original já estava quitado (é aí que existe dinheiro de
 * verdade voltando/saindo, e vira uma contrapartida — ver estorno.service.ts).
 */

import { useState } from 'react';
import {
  type DadosEstorno,
  type FormaPagamento,
  dadosEstornoVazio,
  validarEstorno,
  semErros,
  ROTULO_FORMA_PAGAMENTO,
  type ErrosValidacao,
} from '../types';

interface Props {
  /** Ex.: "Estornar lançamento" (padrão) ou "Devolver item" (devolução parcial). */
  titulo?: string;
  descricao: string;
  /** Original já estava pago/recebido — vai gerar contrapartida, então pede forma de pagamento. */
  precisaFormaPagamento: boolean;
  onConfirmar: (dados: DadosEstorno) => Promise<void> | void;
  onCancelar?: () => void;
}

const FORMAS = Object.keys(ROTULO_FORMA_PAGAMENTO) as FormaPagamento[];

export function FormEstorno({ titulo = 'Estornar lançamento', descricao, precisaFormaPagamento, onConfirmar, onCancelar }: Props) {
  const [dados, setDados] = useState<DadosEstorno>(dadosEstornoVazio());
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function set(patch: Partial<DadosEstorno>) {
    setDados((d) => ({ ...d, ...patch }));
  }

  async function handleConfirmar() {
    const e = validarEstorno(dados, precisaFormaPagamento);
    setErros(e);
    if (!semErros(e)) return;
    setErroSalvar(null);
    setSalvando(true);
    try {
      await onConfirmar(dados);
    } catch (erro) {
      setErroSalvar(erro instanceof Error ? erro.message : 'Não foi possível estornar este lançamento.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fin-form">
      <div className="fin-form-head">
        <h2>{titulo}</h2>
      </div>

      <p className="fin-aviso">{descricao}</p>

      {precisaFormaPagamento && (
        <p className="fin-aviso">
          Este lançamento já estava quitado — estornar gera uma contrapartida (dinheiro saindo/voltando de
          verdade agora), não apaga o histórico.
        </p>
      )}

      <div className="fin-campo">
        <label>Motivo *</label>
        <textarea
          rows={2}
          value={dados.motivo}
          onChange={(e) => set({ motivo: e.target.value })}
          placeholder="Ex.: cliente devolveu a peça, serviço não funcionou, lançamento duplicado…"
          aria-invalid={!!erros.motivo}
          autoFocus
        />
        {erros.motivo && <span className="fin-erro">{erros.motivo}</span>}
      </div>

      {precisaFormaPagamento && (
        <div className="fin-campo">
          <label>Como o dinheiro está sendo devolvido? *</label>
          <select
            value={dados.formaPagamento}
            onChange={(e) => set({ formaPagamento: e.target.value as FormaPagamento })}
            aria-invalid={!!erros.formaPagamento}
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
      )}

      {erroSalvar && <p className="fin-erro">{erroSalvar}</p>}

      <div className="fin-acoes">
        {onCancelar && (
          <button type="button" className="fin-btn-sec" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="button" className="fin-btn" onClick={handleConfirmar} disabled={salvando}>
          {salvando ? 'Estornando…' : 'Confirmar estorno'}
        </button>
      </div>
    </div>
  );
}
