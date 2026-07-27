/**
 * ============================================================================
 * MOVIMENTAÇÕES DE UMA PEÇA
 * ============================================================================
 * Histórico do razão + ações para registrar entrada ou ajuste. Usado na linha
 * expandida da lista de peças, na tela de Estoque.
 */

import { useEffect, useState } from 'react';
import { PackagePlus, SlidersHorizontal } from 'lucide-react';
import type { DadosEntrada, DadosAjuste, Movimentacao } from '../types';
import { listarMovimentacoesPorPeca, registrarEntrada, registrarAjuste } from '../services/movimentacao.service';
import { FormMovimentacao } from './FormMovimentacao';

interface Props {
  pecaId: string;
  /** Chamado depois de registrar uma movimentação — pai deve recarregar a peça (saldo/custo mudaram). */
  aoRegistrar: () => void;
}

const ROTULO_TIPO: Record<Movimentacao['tipo'], string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste: 'Ajuste',
};

export function MovimentacoesDaPeca({ pecaId, aoRegistrar }: Props) {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [acaoAberta, setAcaoAberta] = useState<'entrada' | 'ajuste' | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setMovimentacoes(await listarMovimentacoesPorPeca(pecaId));
    } catch {
      setErro('Não foi possível carregar as movimentações.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pecaId]);

  async function handleSalvarEntrada(d: DadosEntrada) {
    await registrarEntrada({
      pecaId,
      quantidade: Number(d.quantidade),
      custoUnit: Number(d.custoUnit),
      fornecedorId: d.fornecedorId || undefined,
      observacoes: d.observacoes || undefined,
    });
    setAcaoAberta(null);
    await carregar();
    aoRegistrar();
  }

  async function handleSalvarAjuste(d: DadosAjuste) {
    const sinal = d.sentido === 'diminuir' ? -1 : 1;
    await registrarAjuste({
      pecaId,
      quantidade: sinal * Number(d.quantidade),
      observacoes: d.observacoes,
    });
    setAcaoAberta(null);
    await carregar();
    aoRegistrar();
  }

  if (acaoAberta === 'entrada') {
    return <FormMovimentacao tipo="entrada" onSalvar={handleSalvarEntrada} onCancelar={() => setAcaoAberta(null)} />;
  }
  if (acaoAberta === 'ajuste') {
    return <FormMovimentacao tipo="ajuste" onSalvar={handleSalvarAjuste} onCancelar={() => setAcaoAberta(null)} />;
  }

  return (
    <div className="est-movs">
      <div className="est-movs-head">
        <strong>Movimentações</strong>
        <span className="est-movs-acoes-topo">
          <button type="button" className="est-btn" onClick={() => setAcaoAberta('entrada')}>
            <PackagePlus size={16} /> Entrada
          </button>
          <button type="button" className="est-btn-sec" onClick={() => setAcaoAberta('ajuste')}>
            <SlidersHorizontal size={15} /> Ajustar
          </button>
        </span>
      </div>

      {carregando && <p>Carregando…</p>}
      {erro && <p className="est-erro">{erro}</p>}

      {!carregando && !erro && movimentacoes.length === 0 && (
        <p className="est-movs-vazio">Nenhuma movimentação registrada ainda.</p>
      )}

      {!carregando && movimentacoes.length > 0 && (
        <ul className="est-movs-lista">
          {movimentacoes.map((m) => (
            <li key={m.id}>
              <span className={`est-badge est-badge-${m.tipo}`}>{ROTULO_TIPO[m.tipo]}</span>
              <span className="est-movs-qtd">
                {m.tipo === 'saida' ? '-' : m.quantidade > 0 ? '+' : ''}
                {m.quantidade}
              </span>
              <span className="est-movs-obs">{m.observacoes || m.origem || '—'}</span>
              <span className="est-movs-data">
                {m.createdAt && new Date(m.createdAt).toLocaleString('pt-BR')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
