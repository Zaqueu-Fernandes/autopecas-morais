/**
 * ============================================================================
 * FORMULÁRIO — NOVA CONTA A RECEBER (lançamento manual)
 * ============================================================================
 * Cobre receita avulsa que NÃO vem de faturar OS nem finalizar venda de
 * balcão (ex.: reembolso de terceiro, serviço cobrado fora do fluxo normal).
 * Nasce sempre na categoria fixa 'receita_avulsa' — servico_os/venda_balcao
 * continuam só nascendo do faturamento automático, nunca digitadas aqui.
 */

import { useEffect, useState } from 'react';
import {
  type DadosContaReceber,
  dadosContaReceberVazio,
  validarContaReceber,
  semErros,
  type ErrosValidacao,
} from '../types';
import { type Cliente, listarClientes } from '@/features/cadastros';

interface Props {
  onSalvar: (d: DadosContaReceber) => Promise<void> | void;
  onCancelar?: () => void;
}

export function FormContaReceber({ onSalvar, onCancelar }: Props) {
  const [dados, setDados] = useState<DadosContaReceber>(dadosContaReceberVazio());
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    listarClientes().then(setClientes).catch(() => setClientes([]));
  }, []);

  function set(patch: Partial<DadosContaReceber>) {
    setDados((d) => ({ ...d, ...patch }));
  }

  async function handleSalvar() {
    const e = validarContaReceber(dados);
    setErros(e);
    if (!semErros(e)) return;
    setErroSalvar(null);
    setSalvando(true);
    try {
      await onSalvar(dados);
    } catch (erro) {
      setErroSalvar(erro instanceof Error ? erro.message : 'Não foi possível salvar esta receita.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fin-form">
      <div className="fin-form-head">
        <h2>Nova conta a receber</h2>
      </div>

      <p className="fin-aviso">
        Use só pra receita que NÃO passa por Ordem de Serviço nem Venda de Balcão (ex.: reembolso de
        terceiro, serviço avulso cobrado fora do fluxo normal). Venda de peça sempre deve entrar por
        Vendas de Balcão — é o que dá baixa no estoque. A empresa que recebe é escolhida mais tarde,
        no momento de Quitar — não agora.
      </p>

      <div className="fin-grid">
        <div className="fin-campo fin-col-2">
          <label htmlFor="cr-descricao">Descrição *</label>
          <input
            id="cr-descricao"
            value={dados.descricao}
            onChange={(e) => set({ descricao: e.target.value })}
            placeholder="Ex.: reembolso de terceiro, serviço avulso…"
            aria-invalid={!!erros.descricao}
            autoFocus
          />
          {erros.descricao && (
            <span className="fin-erro" aria-live="polite">
              {erros.descricao}
            </span>
          )}
        </div>

        <div className="fin-campo">
          <label htmlFor="cr-valor">Valor (R$) *</label>
          <input
            id="cr-valor"
            inputMode="decimal"
            value={dados.valor}
            onChange={(e) => set({ valor: e.target.value })}
            placeholder="0,00"
            aria-invalid={!!erros.valor}
          />
          {erros.valor && (
            <span className="fin-erro" aria-live="polite">
              {erros.valor}
            </span>
          )}
        </div>

        <div className="fin-campo">
          <label htmlFor="cr-vencimento">Vencimento *</label>
          <input
            id="cr-vencimento"
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

        <div className="fin-campo">
          <label htmlFor="cr-cliente">Cliente</label>
          <select id="cr-cliente" value={dados.clienteId} onChange={(e) => set({ clienteId: e.target.value })}>
            <option value="">— nenhum —</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="fin-campo">
        <label htmlFor="cr-observacoes">Observações</label>
        <textarea
          id="cr-observacoes"
          rows={2}
          value={dados.observacoes}
          onChange={(e) => set({ observacoes: e.target.value })}
        />
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
        <button type="button" className="fin-btn" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar receita'}
        </button>
      </div>
    </div>
  );
}
