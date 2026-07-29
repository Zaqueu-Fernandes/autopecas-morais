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
import { type ContaFinanceira, listarContasFinanceiras, ROTULO_TIPO_CONTA } from '@/features/contas-financeiras';
import { formatarMoeda } from '@/shared/utils/formatadores';

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
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [contas, setContas] = useState<ContaFinanceira[]>([]);

  useEffect(() => {
    listarEmpresas().then((lista) => {
      setEmpresas(lista);
      if (lista.length === 1) set({ empresaId: lista[0].id });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recarrega as contas toda vez que a empresa muda — só mostra as dela +
  // as compartilhadas (sem empresa definida). Limpa a conta já escolhida se
  // ela não fizer mais parte da lista nova.
  useEffect(() => {
    listarContasFinanceiras({ empresaId: dados.empresaId || undefined })
      .then((lista) => {
        setContas(lista);
        setDados((d) => (lista.some((c) => c.id === d.contaFinanceiraId) ? d : { ...d, contaFinanceiraId: '' }));
      })
      .catch(() => setContas([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados.empresaId]);

  function set(patch: Partial<DadosFaturamento>) {
    setDados((d) => ({ ...d, ...patch }));
  }

  async function handleConfirmar() {
    const e = validarFaturamento(dados);
    setErros(e);
    if (!semErros(e)) return;
    setErroSalvar(null);
    setSalvando(true);
    try {
      await faturarOS({ osId, clienteId, valorTotal, dados });
      onFaturado();
    } catch (erro) {
      setErroSalvar(erro instanceof Error ? erro.message : 'Não foi possível faturar esta OS.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fin-form">
      <div className="fin-form-head">
        <h2>Faturar OS</h2>
        <span className="fin-tag">Total: {formatarMoeda(valorTotal)}</span>
      </div>

      <div className="fin-campo">
        <label htmlFor="ft-empresa">Empresa (CNPJ) *</label>
        <select
          id="ft-empresa"
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
        {erros.empresaId && (
          <span className="fin-erro" aria-live="polite">
            {erros.empresaId}
          </span>
        )}
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
            aria-pressed={dados.situacao === s}
            onClick={() => set({ situacao: s })}
          >
            {ROTULO_SITUACAO[s]}
          </button>
        ))}
      </div>

      {dados.situacao === 'a_vista' && (
        <div className="fin-campo">
          <label htmlFor="ft-forma">Forma de pagamento *</label>
          <select
            id="ft-forma"
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
          {erros.formaPagamento && (
            <span className="fin-erro" aria-live="polite">
              {erros.formaPagamento}
            </span>
          )}
        </div>
      )}

      {dados.situacao === 'a_vista' && (
        <div className="fin-campo">
          <label htmlFor="ft-conta">Conta *</label>
          <select
            id="ft-conta"
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
            <span className="fin-aviso">Cadastre uma conta financeira em Cadastros antes de faturar à vista.</span>
          )}
        </div>
      )}

      {dados.situacao === 'a_prazo' && (
        <div className="fin-campo">
          <label htmlFor="ft-vencimento">Vencimento *</label>
          <input
            id="ft-vencimento"
            type="date"
            value={dados.vencimento}
            onChange={(e) => set({ vencimento: e.target.value })}
            aria-invalid={!!erros.vencimento}
          />
          {erros.vencimento && (
            <span className="fin-erro" aria-live="polite">
              {erros.vencimento}
            </span>
          )}
        </div>
      )}

      {dados.situacao === 'fiado' && (
        <p className="fin-aviso">
          Fica em aberto, sem data de vencimento, amarrado ao cliente da OS.
        </p>
      )}

      <p className="fin-aviso">Depois de faturar, a OS trava e não aceita mais itens.</p>

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
          {salvando ? 'Faturando…' : 'Confirmar faturamento'}
        </button>
      </div>
    </div>
  );
}
