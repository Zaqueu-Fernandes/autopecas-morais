/**
 * ============================================================================
 * FORMULÁRIO — FINALIZAR VENDA DE BALCÃO (3 situações de recebimento)
 * ============================================================================
 * Igual ao faturamento de OS, mas a_prazo/fiado só ficam disponíveis se a
 * venda já tiver um cliente vinculado (não dá pra fiar de "avulso").
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
import { finalizarVenda } from '../services/venda.service';
import { type Empresa, listarEmpresas } from '@/features/empresa';
import { type ContaFinanceira, listarContasFinanceiras, ROTULO_TIPO_CONTA } from '@/features/contas-financeiras';
import { formatarMoeda } from '@/shared/utils/formatadores';

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
      await finalizarVenda({ vendaId, clienteId, valorTotal, dados });
      onFinalizada();
    } catch (erro) {
      setErroSalvar(erro instanceof Error ? erro.message : 'Não foi possível finalizar esta venda.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fin-form">
      <div className="fin-form-head">
        <h2>Finalizar venda</h2>
        <span className="fin-tag">Total: {formatarMoeda(valorTotal)}</span>
      </div>

      <div className="fin-campo">
        <label htmlFor="fv-empresa">Empresa (CNPJ) *</label>
        <select
          id="fv-empresa"
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
          <span className="fin-aviso">Cadastre uma empresa na aba Empresas antes de finalizar.</span>
        )}
      </div>

      <div className="fin-tipo">
        {SITUACOES.map((s) => (
          <button
            key={s}
            type="button"
            className={dados.situacao === s ? 'ativo' : ''}
            aria-pressed={dados.situacao === s}
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
          <label htmlFor="fv-forma">Forma de pagamento *</label>
          <select
            id="fv-forma"
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
          <label htmlFor="fv-conta">Conta *</label>
          <select
            id="fv-conta"
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
            <span className="fin-aviso">Cadastre uma conta financeira em Cadastros antes de finalizar à vista.</span>
          )}
        </div>
      )}

      {dados.situacao === 'a_prazo' && (
        <div className="fin-campo">
          <label htmlFor="fv-vencimento">Vencimento *</label>
          <input
            id="fv-vencimento"
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
        <p className="fin-aviso">Fica em aberto, sem data de vencimento, amarrado ao cliente da venda.</p>
      )}

      <p className="fin-aviso">Depois de finalizar, a venda trava e não aceita mais itens.</p>

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
          {salvando ? 'Finalizando…' : 'Confirmar finalização'}
        </button>
      </div>
    </div>
  );
}
