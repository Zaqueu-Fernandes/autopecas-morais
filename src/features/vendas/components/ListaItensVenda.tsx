/**
 * ============================================================================
 * ITENS DE UMA VENDA DE BALCÃO
 * ============================================================================
 * Lista os itens com total, permite adicionar peça e remover (com motivo —
 * item removido continua visível, riscado, pra manter o histórico).
 * Quando `bloqueado` (venda finalizada), some com as ações de editar.
 */

import { useEffect, useState } from 'react';
import { PackagePlus, Trash2, Undo2 } from 'lucide-react';
import type { DadosItemVenda, ItemVenda } from '../types';
import {
  listarItensPorVenda,
  adicionarItemVenda,
  removerItemVenda,
  devolverItemVenda,
} from '../services/itens.service';
import { FormItemVenda } from './FormItemVenda';
import type { Peca } from '@/features/estoque';
import { FormEstorno, type DadosEstorno } from '@/features/financeiro';
import { useConfirmacao } from '@/shared/hooks/useConfirmacao';
import { formatarMoeda } from '@/shared/utils/formatadores';

interface Props {
  vendaId: string;
  /** Só precisos quando `bloqueado` — vão na descrição/vínculo do reembolso de uma devolução. */
  vendaNumero?: number;
  vendaClienteId?: string | null;
  bloqueado?: boolean;
  aoAtualizarTotal?: (total: number) => void;
  /** Chamado toda vez que os itens (re)carregam, com a lista completa (ex.: pra impressão). */
  aoAtualizarItens?: (itens: ItemVenda[]) => void;
}

export function ListaItensVenda({
  vendaId,
  vendaNumero,
  vendaClienteId,
  bloqueado = false,
  aoAtualizarTotal,
  aoAtualizarItens,
}: Props) {
  const { confirmar } = useConfirmacao();
  const [itens, setItens] = useState<ItemVenda[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [itemParaDevolver, setItemParaDevolver] = useState<ItemVenda | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await listarItensPorVenda(vendaId);
      setItens(lista);
      const total = lista.filter((i) => !i.removido).reduce((soma, i) => soma + i.quantidade * i.valorUnit, 0);
      aoAtualizarTotal?.(total);
      aoAtualizarItens?.(lista);
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
    const ok = await confirmar({
      titulo: 'Remover item',
      tom: 'perigo',
      mensagem: [
        `“${item.descricao}” será removido desta venda.`,
        'A peça volta pro estoque (ajuste de volta, sem mexer no custo médio).',
        'O item não é apagado de verdade — continua no histórico, marcado como removido.',
      ],
      textoConfirmar: 'Remover',
    });
    if (!ok) return;
    await removerItemVenda(item, 'Removido pelo usuário antes da finalização.');
    await carregar();
  }

  async function handleDevolver(dados: DadosEstorno) {
    if (!itemParaDevolver || !dados.formaPagamento || !dados.contaFinanceiraId) return;
    const item = itemParaDevolver;
    const valor = item.quantidade * item.valorUnit;
    const ok = await confirmar({
      titulo: 'Confirmar devolução de item',
      tom: 'perigo',
      mensagem: [
        `“${item.descricao}” — ${formatarMoeda(valor)}.`,
        'A peça volta pro estoque (ajuste, sem mexer no custo médio) e o item fica marcado como devolvido no histórico da venda.',
        'Essa venda já foi finalizada: o valor do item é descontado ou reembolsado no Financeiro, conforme a forma de pagamento escolhida.',
      ],
      textoConfirmar: 'Sim, devolver item',
    });
    if (!ok) return;

    await devolverItemVenda(
      item,
      { id: vendaId, numero: vendaNumero, clienteId: vendaClienteId ?? null },
      dados.motivo,
      dados.formaPagamento,
      dados.contaFinanceiraId,
    );
    setItemParaDevolver(null);
    await carregar();
  }

  const total = itens.filter((i) => !i.removido).reduce((soma, i) => soma + i.quantidade * i.valorUnit, 0);

  if (mostrarForm) {
    return <FormItemVenda onSalvar={handleSalvar} onCancelar={() => setMostrarForm(false)} />;
  }
  if (itemParaDevolver) {
    return (
      <FormEstorno
        titulo="Devolver item"
        descricao={`${itemParaDevolver.descricao} — ${formatarMoeda(
          itemParaDevolver.quantidade * itemParaDevolver.valorUnit,
        )}`}
        precisaFormaPagamento
        onConfirmar={handleDevolver}
        onCancelar={() => setItemParaDevolver(null)}
      />
    );
  }

  return (
    <div className="vd-itens">
      <div className="vd-itens-head">
        <strong>Itens</strong>
        {!bloqueado && (
          <button type="button" className="vd-btn" onClick={() => setMostrarForm(true)}>
            <PackagePlus size={16} /> Peça
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
                <span className="vd-itens-valor">{formatarMoeda(item.quantidade * item.valorUnit)}</span>
                {item.removido ? (
                  <span className="vd-itens-motivo">
                    {item.motivoRemocao?.startsWith('Devolução') ? '' : 'Removido: '}
                    {item.motivoRemocao}
                  </span>
                ) : !bloqueado ? (
                  <button type="button" className="vd-itens-remover" onClick={() => handleRemover(item)}>
                    <Trash2 size={14} /> Remover
                  </button>
                ) : (
                  <button type="button" className="vd-itens-remover" onClick={() => setItemParaDevolver(item)}>
                    <Undo2 size={14} /> Devolver
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="vd-itens-total">Total: {formatarMoeda(total)}</div>
        </>
      )}
    </div>
  );
}
