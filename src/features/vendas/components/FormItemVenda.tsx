/**
 * ============================================================================
 * FORMULÁRIO DE ITEM DA VENDA (peça)
 * ============================================================================
 * A baixa de verdade acontece no service (adicionarItemVenda) — aqui só
 * validamos o básico e mostramos o saldo disponível.
 */

import { useEffect, useState } from 'react';
import {
  type DadosItemVenda,
  dadosItemVendaVazio,
  validarItemVenda,
  semErros,
  type ErrosValidacao,
} from '../types';
import { type Peca, listarPecas } from '@/features/estoque';
import { formatarMoeda } from '@/shared/utils/formatadores';

interface Props {
  onSalvar: (d: DadosItemVenda, peca: Peca) => Promise<void> | void;
  onCancelar?: () => void;
}

export function FormItemVenda({ onSalvar, onCancelar }: Props) {
  const [dados, setDados] = useState<DadosItemVenda>(dadosItemVendaVazio());
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [salvando, setSalvando] = useState(false);
  const [pecas, setPecas] = useState<Peca[]>([]);

  useEffect(() => {
    listarPecas().then(setPecas).catch(() => setPecas([]));
  }, []);

  const pecaSelecionada = pecas.find((p) => p.id === dados.pecaId) ?? null;

  function set(patch: Partial<DadosItemVenda>) {
    setDados((d) => ({ ...d, ...patch }));
  }

  async function handleSalvar() {
    const e = validarItemVenda(dados);
    if (!e.quantidade && pecaSelecionada && Number(dados.quantidade) > pecaSelecionada.qtd) {
      e.quantidade = `Só há ${pecaSelecionada.qtd} ${pecaSelecionada.unidade} em estoque.`;
    }
    setErros(e);
    if (!semErros(e) || !pecaSelecionada) {
      if (e.pecaId) document.getElementById('vd-item-peca')?.focus();
      else if (e.quantidade) document.getElementById('vd-item-peca-quantidade')?.focus();
      return;
    }

    setSalvando(true);
    try {
      await onSalvar(dados, pecaSelecionada);
    } catch (err) {
      setErros({ quantidade: err instanceof Error ? err.message : 'Não foi possível dar baixa no estoque.' });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="vd-form">
      <div className="vd-form-head">
        <h2>Adicionar peça</h2>
      </div>

      <div className="vd-grid">
        <div className="vd-campo vd-col-2">
          <label htmlFor="vd-item-peca">Peça *</label>
          <select
            id="vd-item-peca"
            name="pecaId"
            autoComplete="off"
            value={dados.pecaId}
            onChange={(e) => set({ pecaId: e.target.value })}
            aria-invalid={!!erros.pecaId}
          >
            <option value="">— selecione —</option>
            {pecas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} (estoque: {p.qtd} {p.unidade})
              </option>
            ))}
          </select>
          {erros.pecaId && <span className="vd-erro">{erros.pecaId}</span>}
        </div>

        <div className="vd-campo">
          <label htmlFor="vd-item-peca-quantidade">Quantidade *</label>
          <input
            id="vd-item-peca-quantidade"
            name="quantidade"
            autoComplete="off"
            inputMode="numeric"
            value={dados.quantidade}
            onChange={(e) => set({ quantidade: e.target.value })}
            aria-invalid={!!erros.quantidade}
          />
          {erros.quantidade && <span className="vd-erro">{erros.quantidade}</span>}
        </div>

        {pecaSelecionada && (
          <div className="vd-campo">
            <label id="vd-item-peca-preco-label">Preço unitário</label>
            <p className="vd-valor-info" aria-labelledby="vd-item-peca-preco-label">
              {formatarMoeda(Number(pecaSelecionada.precoVenda))}
            </p>
          </div>
        )}
      </div>

      <div className="vd-acoes">
        {onCancelar && (
          <button type="button" className="vd-btn-sec" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="button" className="vd-btn" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Adicionar peça'}
        </button>
      </div>
    </div>
  );
}
