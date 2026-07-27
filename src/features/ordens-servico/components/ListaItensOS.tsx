/**
 * ============================================================================
 * ITENS DE UMA OS (peças + serviços)
 * ============================================================================
 * Lista os itens com total, permite adicionar peça/serviço e remover (com
 * motivo — item removido continua visível, riscado, pra manter o histórico).
 * Quando `bloqueado` (OS faturada), some com as ações de editar.
 */

import { useEffect, useState } from 'react';
import { Trash2, Wrench, PackagePlus } from 'lucide-react';
import type { DadosItemPeca, DadosItemServico, ItemOS } from '../types';
import { listarItensPorOS, adicionarItemPeca, adicionarItemServico, removerItem } from '../services/itens.service';
import { FormItemOS } from './FormItemOS';
import type { Peca } from '@/features/estoque';

interface Props {
  osId: string;
  bloqueado?: boolean;
  /** Chamado toda vez que os itens (re)carregam, com o total não removido. */
  aoAtualizarTotal?: (total: number) => void;
  /** Chamado toda vez que os itens (re)carregam, com a lista completa (ex.: pra impressão). */
  aoAtualizarItens?: (itens: ItemOS[]) => void;
}

export function ListaItensOS({ osId, bloqueado = false, aoAtualizarTotal, aoAtualizarItens }: Props) {
  const [itens, setItens] = useState<ItemOS[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [acaoAberta, setAcaoAberta] = useState<'peca' | 'servico' | null>(null);

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
    const motivo = window.prompt('Motivo da remoção deste item:');
    if (!motivo) return;
    await removerItem(item, motivo);
    await carregar();
  }

  const total = itens.filter((i) => !i.removido).reduce((soma, i) => soma + i.quantidade * i.valorUnit, 0);

  if (acaoAberta === 'peca') {
    return <FormItemOS tipo="peca" onSalvar={handleSalvarPeca} onCancelar={() => setAcaoAberta(null)} />;
  }
  if (acaoAberta === 'servico') {
    return <FormItemOS tipo="servico" onSalvar={handleSalvarServico} onCancelar={() => setAcaoAberta(null)} />;
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
                <span className="os-itens-valor">R$ {(item.quantidade * item.valorUnit).toFixed(2)}</span>
                {item.removido ? (
                  <span className="os-itens-motivo">Removido: {item.motivoRemocao}</span>
                ) : !bloqueado ? (
                  <button type="button" className="os-itens-remover" onClick={() => handleRemover(item)}>
                    <Trash2 size={14} /> Remover
                  </button>
                ) : (
                  <span />
                )}
              </li>
            ))}
          </ul>
          <div className="os-itens-total">Total: R$ {total.toFixed(2)}</div>
        </>
      )}
    </div>
  );
}
