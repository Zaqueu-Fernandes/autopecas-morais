/**
 * ============================================================================
 * ITENS DE UMA VENDA DE BALCÃO
 * ============================================================================
 * Lista os itens com total, permite adicionar peça e remover (com motivo —
 * item removido continua visível, riscado, pra manter o histórico).
 * Quando `bloqueado` (venda finalizada), some com as ações de editar.
 */

import { useEffect, useState } from 'react';
import type { DadosItemVenda, ItemVenda } from '../types';
import { listarItensPorVenda, adicionarItemVenda, removerItemVenda } from '../services/itens.service';
import { FormItemVenda } from './FormItemVenda';
import type { Peca } from '@/features/estoque';

interface Props {
  vendaId: string;
  bloqueado?: boolean;
  aoAtualizarTotal?: (total: number) => void;
}

export function ListaItensVenda({ vendaId, bloqueado = false, aoAtualizarTotal }: Props) {
  const [itens, setItens] = useState<ItemVenda[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await listarItensPorVenda(vendaId);
      setItens(lista);
      const total = lista.filter((i) => !i.removido).reduce((soma, i) => soma + i.quantidade * i.valorUnit, 0);
      aoAtualizarTotal?.(total);
    } catch {
      setErro('Não foi possível carregar os itens.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendaId]);

  async function handleSalvar(d: DadosItemVenda, peca: Peca) {
    await adicionarItemVenda(vendaId, peca, Number(d.quantidade));
    setMostrarForm(false);
    await carregar();
  }

  async function handleRemover(item: ItemVenda) {
    const motivo = window.prompt('Motivo da remoção deste item:');
    if (!motivo) return;
    await removerItemVenda(item, motivo);
    await carregar();
  }

  const total = itens.filter((i) => !i.removido).reduce((soma, i) => soma + i.quantidade * i.valorUnit, 0);

  if (mostrarForm) {
    return <FormItemVenda onSalvar={handleSalvar} onCancelar={() => setMostrarForm(false)} />;
  }

  return (
    <div className="vd-itens">
      <div className="vd-itens-head">
        <strong>Itens</strong>
        {!bloqueado && (
          <button type="button" className="vd-btn-sec" onClick={() => setMostrarForm(true)}>
            + Peça
          </button>
        )}
      </div>

      {carregando && <p>Carregando…</p>}
      {erro && <p className="vd-erro">{erro}</p>}

      {!carregando && !erro && itens.length === 0 && <p className="vd-itens-vazio">Nenhum item adicionado ainda.</p>}

      {!carregando && itens.length > 0 && (
        <>
          <ul className="vd-itens-lista">
            {itens.map((item) => (
              <li key={item.id} className={item.removido ? 'vd-item-removido' : ''}>
                <span className="vd-itens-descricao">{item.descricao}</span>
                <span className="vd-itens-qtd">{item.quantidade}x</span>
                <span className="vd-itens-valor">R$ {(item.quantidade * item.valorUnit).toFixed(2)}</span>
                {item.removido ? (
                  <span className="vd-itens-motivo">Removido: {item.motivoRemocao}</span>
                ) : !bloqueado ? (
                  <button type="button" onClick={() => handleRemover(item)}>
                    Remover
                  </button>
                ) : (
                  <span />
                )}
              </li>
            ))}
          </ul>
          <div className="vd-itens-total">Total: R$ {total.toFixed(2)}</div>
        </>
      )}
    </div>
  );
}
