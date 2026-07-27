/**
 * ============================================================================
 * FORMULÁRIO — FINALIZAR VENDA DE BALCÃO (3 situações de recebimento)
 * ============================================================================
 * Igual ao faturamento de OS, mas a_prazo/fiado só ficam disponíveis se a
 * venda já tiver um cliente vinculado (não dá pra fiar de "avulso").
 */

import { useState } from 'react';
import {
  type DadosFaturamento,
  type SituacaoRecebimento,
  type FormaPagamento,
  dadosFaturamentoVazio,
  validarFaturamento,
  semErros,
  ROTULO_SITUACAO,
  ROTULO_FORMA_PAGAMENTO,
  type ErrosValidacao,
} from '../types';
import { finalizarVenda } from '../services/venda.service';

interface Props {
  vendaId: string;
  clienteId: string | null;
  valorTotal: number;
  onFinalizada: () => void;
  onCancelar?: () => void;
}

const SITUACOES = Object.keys(ROTULO_SITUACAO) as SituacaoRecebimento[];
const FORMAS = Object.keys(ROTULO_FORMA_PAGAMENTO) as FormaPagamento[];

export function FormFinalizarVenda({ vendaId, clienteId, valorTotal, onFinalizada, onCancelar }: Props) {
  const [dados, setDados] = useState<DadosFaturamento>(dadosFaturamentoVazio());
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [salvando, setSalvando] = useState(false);

  function set(patch: Partial<DadosFaturamento>) {
    setDados((d) => ({ ...d, ...patch }));
  }

  async function handleConfirmar() {
    const e = validarFaturamento(dados);
    setErros(e);
    if (!semErros(e)) return;
    setSalvando(true);
    try {
      await finalizarVenda({ vendaId, clienteId, valorTotal, dados });
      onFinalizada();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fin-form">
      <div className="fin-form-head">
        <h2>Finalizar venda</h2>
        <span className="fin-tag">Total: R$ {valorTotal.toFixed(2)}</span>
      </div>

      <div className="fin-tipo">
        {SITUACOES.map((s) => (
          <button
            key={s}
            type="button"
            className={dados.situacao === s ? 'ativo' : ''}
            disabled={s !== 'a_vista' && !clienteId}
            onClick={() => set({ situacao: s })}
          >
            {ROTULO_SITUACAO[s]}
          </button>
        ))}
      </div>

      {!clienteId && dados.situacao === 'a_vista' && (
        <p className="fin-aviso">
          Sem cliente selecionado, só é possível finalizar à vista. Escolha um cliente na venda
          pra liberar a prazo/fiado.
        </p>
      )}

      {dados.situacao === 'a_vista' && (
        <div className="fin-campo">
          <label>Forma de pagamento *</label>
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

      {dados.situacao === 'a_prazo' && (
        <div className="fin-campo">
          <label>Vencimento *</label>
          <input
            type="date"
            value={dados.vencimento}
            onChange={(e) => set({ vencimento: e.target.value })}
            aria-invalid={!!erros.vencimento}
          />
          {erros.vencimento && <span className="fin-erro">{erros.vencimento}</span>}
        </div>
      )}

      {dados.situacao === 'fiado' && (
        <p className="fin-aviso">Fica em aberto, sem data de vencimento, amarrado ao cliente da venda.</p>
      )}

      <p className="fin-aviso">Depois de finalizar, a venda trava e não aceita mais itens.</p>

      <div className="fin-acoes">
        {onCancelar && (
          <button type="button" className="fin-btn-sec" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="button" className="fin-btn" onClick={handleConfirmar} disabled={salvando}>
          {salvando ? 'Finalizando…' : 'Confirmar finalização'}
        </button>
      </div>
    </div>
  );
}
