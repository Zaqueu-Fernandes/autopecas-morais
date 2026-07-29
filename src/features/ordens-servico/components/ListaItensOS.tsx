/**
 * ============================================================================
 * ITENS DE UMA OS (peças + serviços)
 * ============================================================================
 * Lista os itens com total, permite adicionar peça/serviço e remover (com
 * motivo — item removido continua visível, riscado, pra manter o histórico).
 * Quando `bloqueado` (OS faturada), some com as ações de editar.
 */

import { useEffect, useState } from 'react';
import { Trash2, Wrench, PackagePlus, Undo2 } from 'lucide-react';
import type { DadosItemPeca, DadosItemServico, ItemOS } from '../types';
import {
  listarItensPorOS,
  adicionarItemPeca,
  adicionarItemServico,
  removerItem,
  devolverItem,
} from '../services/itens.service';
import { FormItemOS } from './FormItemOS';
import type { Peca } from '@/features/estoque';
import { FormEstorno, type DadosEstorno, buscarLancamentoDeOS } from '@/features/financeiro';
import { useConfirmacao } from '@/shared/hooks/useConfirmacao';
import { formatarMoeda } from '@/shared/utils/formatadores';

interface Props {
  osId: string;
  /** Só precisos quando `bloqueado` — vão na descrição/vínculo do reembolso de uma devolução. */
  osNumero?: number;
  osClienteId?: string;
  bloqueado?: boolean;
  /** Chamado toda vez que os itens (re)carregam, com o total não removido. */
  aoAtualizarTotal?: (total: number) => void;
  /** Chamado toda vez que os itens (re)carregam, com a lista completa (ex.: pra impressão). */
  aoAtualizarItens?: (itens: ItemOS[]) => void;
}

export function ListaItensOS({
  osId,
  osNumero,
  osClienteId,
  bloqueado = false,
  aoAtualizarTotal,
  aoAtualizarItens,
}: Props) {
  const { confirmar } = useConfirmacao();
  const [itens, setItens] = useState<ItemOS[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [acaoAberta, setAcaoAberta] = useState<'peca' | 'servico' | null>(null);
  const [itemParaDevolver, setItemParaDevolver] = useState<ItemOS | null>(null);
  const [empresaIdOS, setEmpresaIdOS] = useState<string | null>(null);

  useEffect(() => {
    if (!bloqueado) return;
    buscarLancamentoDeOS(osId).then((l) => setEmpresaIdOS(l?.empresaId ?? null));
  }, [bloqueado, osId]);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await listarItensPorOS(osId);
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
  }, [osId]);

  async function handleSalvarPeca(d: DadosItemPeca, peca: Peca) {
    await adicionarItemPeca(osId, peca, Number(d.quantidade));
    setAcaoAberta(null);
    await carregar();
  }

  async function handleSalvarServico(d: DadosItemServico) {
    await adicionarItemServico(osId, {
      descricao: d.descricao,
      quantidade: Number(d.quantidade),
      valorUnit: Number(d.valorUnit),
    });
    setAcaoAberta(null);
    await carregar();
  }

  async function handleRemover(item: ItemOS) {
    const ok = await confirmar({
      titulo: 'Remover item',
      tom: 'perigo',
      mensagem: [
        `“${item.descricao}” será removido desta OS.`,
        item.tipo === 'peca'
          ? 'A peça volta pro estoque (ajuste de volta, sem mexer no custo médio).'
          : 'O serviço deixa de contar no total da OS.',
        'O item não é apagado de verdade — continua no histórico, marcado como removido.',
      ],
      textoConfirmar: 'Remover',
    });
    if (!ok) return;
    await removerItem(item, 'Removido pelo usuário antes do faturamento.');
    await carregar();
  }

  async function handleDevolver(dados: DadosEstorno) {
    if (!itemParaDevolver || !osClienteId || !dados.formaPagamento || !dados.contaFinanceiraId) return;
    const item = itemParaDevolver;
    const valor = item.quantidade * item.valorUnit;
    const ok = await confirmar({
      titulo: 'Confirmar devolução de item',
      tom: 'perigo',
      mensagem: [
        `“${item.descricao}” — ${formatarMoeda(valor)}.`,
        item.tipo === 'peca'
          ? 'A peça volta pro estoque (ajuste, sem mexer no custo médio) e o item fica marcado como devolvido no histórico da OS.'
          : 'O serviço fica marcado como devolvido no histórico da OS (não afeta estoque).',
        'Essa OS já foi faturada: o valor do item é descontado ou reembolsado no Financeiro, conforme a forma de pagamento escolhida.',
      ],
      textoConfirmar: 'Sim, devolver item',
    });
    if (!ok) return;

    await devolverItem(
      item,
      { id: osId, numero: osNumero, clienteId: osClienteId },
      dados.motivo,
      dados.formaPagamento,
      dados.contaFinanceiraId,
    );
    setItemParaDevolver(null);
    await carregar();
  }

  const total = itens.filter((i) => !i.removido).reduce((soma, i) => soma + i.quantidade * i.valorUnit, 0);

  if (acaoAberta === 'peca') {
    return <FormItemOS tipo="peca" onSalvar={handleSalvarPeca} onCancelar={() => setAcaoAberta(null)} />;
  }
  if (acaoAberta === 'servico') {
    return <FormItemOS tipo="servico" onSalvar={handleSalvarServico} onCancelar={() => setAcaoAberta(null)} />;
  }
  if (itemParaDevolver) {
    return (
      <FormEstorno
        titulo="Devolver item"
        descricao={`${itemParaDevolver.descricao} — ${formatarMoeda(
          itemParaDevolver.quantidade * itemParaDevolver.valorUnit,
        )}`}
        precisaFormaPagamento
        empresaId={empresaIdOS}
        onConfirmar={handleDevolver}
        onCancelar={() => setItemParaDevolver(null)}
      />
    );
  }

  return (
    <div className="os-itens">
      <div className="os-itens-head">
        <strong>Itens</strong>
        {!bloqueado && (
          <span className="os-itens-acoes-topo">
            <button type="button" className="os-btn" onClick={() => setAcaoAberta('peca')}>
              <PackagePlus size={16} /> Peça
            </button>
            <button type="button" className="os-btn" onClick={() => setAcaoAberta('servico')}>
              <Wrench size={16} /> Serviço
            </button>
          </span>
        )}
      </div>

      {carregando && <p>Carregando…</p>}
      {erro && <p className="os-erro">{erro}</p>}

      {!carregando && !erro && itens.length === 0 && <p className="os-itens-vazio">Nenhum item adicionado ainda.</p>}

      {!carregando && itens.length > 0 && (
        <>
          <ul className="os-itens-lista">
            {itens.map((item) => (
              <li key={item.id} className={item.removido ? 'os-item-removido' : ''}>
                <span className={`os-badge os-badge-${item.tipo}`}>
                  {item.tipo === 'peca' ? 'Peça' : 'Serviço'}
                </span>
                <span className="os-itens-descricao">{item.descricao}</span>
                <span className="os-itens-qtd">{item.quantidade}x</span>
                <span className="os-itens-valor">{formatarMoeda(item.quantidade * item.valorUnit)}</span>
                {item.removido ? (
                  <span className="os-itens-motivo">
                    {item.motivoRemocao?.startsWith('Devolução') ? '' : 'Removido: '}
                    {item.motivoRemocao}
                  </span>
                ) : !bloqueado ? (
                  <button type="button" className="os-itens-remover" onClick={() => handleRemover(item)}>
                    <Trash2 size={14} /> Remover
                  </button>
                ) : (
                  <button
                    type="button"
                    className="os-itens-remover"
                    onClick={() => setItemParaDevolver(item)}
                    disabled={!osClienteId}
                  >
                    <Undo2 size={14} /> Devolver
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="os-itens-total">Total: {formatarMoeda(total)}</div>
        </>
      )}
    </div>
  );
}
