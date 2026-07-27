/**
 * ============================================================================
 * FORMULÁRIO — FATURAR OS (3 situações de recebimento)
 * ============================================================================
 * À vista: já marca como recebido. A prazo: define vencimento. Fiado: fica
 * em aberto, amarrado ao cliente (sem vencimento). Ao confirmar, a OS é
 * travada (status='faturada') — ver faturamento.service.ts.
 */

import { useEffect, useState } from 'react';
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
import { faturarOS } from '../services/faturamento.service';
import { type Empresa, listarEmpresas } from '@/features/empresa';

interface Props {
  osId: string;
  clienteId: string;
  valorTotal: number;
  onFaturado: () => void;
  onCancelar?: () => void;
}

const SITUACOES = Object.keys(ROTULO_SITUACAO) as SituacaoRecebimento[];
const FORMAS = Object.keys(ROTULO_FORMA_PAGAMENTO) as FormaPagamento[];

export function FormFaturamento({ osId, clienteId, valorTotal, onFaturado, onCancelar }: Props) {
  const [dados, setDados] = useState<DadosFaturamento>(dadosFaturamentoVazio());
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [salvando, setSalvando] = useState(false);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  useEffect(() => {
    listarEmpresas().then((lista) => {
      setEmpresas(lista);
      if (lista.length === 1) set({ empresaId: lista[0].id });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set(patch: Partial<DadosFaturamento>) {
    setDados((d) => ({ ...d, ...patch }));
  }

  async function handleConfirmar() {
    const e = validarFaturamento(dados);
    setErros(e);
    if (!semErros(e)) return;
    setSalvando(true);
    try {
      await faturarOS({ osId, clienteId, valorTotal, dados });
      onFaturado();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fin-form">
      <div className="fin-form-head">
        <h2>Faturar OS</h2>
        <span className="fin-tag">Total: R$ {valorTotal.toFixed(2)}</span>
      </div>

      <div className="fin-campo">
        <label>Empresa (CNPJ) *</label>
        <select
          value={dados.empresaId}
          onChange={(e) => set({ empresaId: e.target.value })}
          aria-invalid={!!erros.empresaId}
        >
          <option value="">— selecione —</option>
          {empresas.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.nomeFantasia}
            </option>
          ))}
        </select>
        {erros.empresaId && <span className="fin-erro">{erros.empresaId}</span>}
        {empresas.length === 0 && (
          <span className="fin-aviso">Cadastre uma empresa na aba Empresas antes de faturar.</span>
        )}
      </div>

      <div className="fin-tipo">
        {SITUACOES.map((s) => (
          <button
            key={s}
            type="button"
            className={dados.situacao === s ? 'ativo' : ''}
            onClick={() => set({ situacao: s })}
          >
            {ROTULO_SITUACAO[s]}
          </button>
        ))}
      </div>

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
        <p className="fin-aviso">
          Fica em aberto, sem data de vencimento, amarrado ao cliente da OS.
        </p>
      )}

      <p className="fin-aviso">Depois de faturar, a OS trava e não aceita mais itens.</p>

      <div className="fin-acoes">
        {onCancelar && (
          <button type="button" className="fin-btn-sec" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="button" className="fin-btn" onClick={handleConfirmar} disabled={salvando}>
          {salvando ? 'Faturando…' : 'Confirmar faturamento'}
        </button>
      </div>
    </div>
  );
}
