/**
 * ============================================================================
 * MOVIMENTAÇÕES DE UMA PEÇA
 * ============================================================================
 * Histórico do razão + ações para registrar entrada ou ajuste. Usado na linha
 * expandida da lista de peças, na tela de Estoque.
 */

import { useEffect, useState } from 'react';
import { PackagePlus, SlidersHorizontal, PackageMinus } from 'lucide-react';
import type { DadosEntrada, DadosAjuste, DadosDevolucaoFornecedor, Movimentacao } from '../types';
import {
  listarMovimentacoesPorPeca,
  registrarEntrada,
  registrarAjuste,
  registrarDevolucaoFornecedor,
} from '../services/movimentacao.service';
import { FormMovimentacao } from './FormMovimentacao';
import { useAuth } from '@/features/auth';
import { useConfirmacao } from '@/shared/hooks/useConfirmacao';

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

/** Rótulo amigável pras origens conhecidas — o resto (texto livre) aparece como veio. */
const ROTULO_ORIGEM: Record<string, string> = {
  compra_fornecedor: 'Compra de fornecedor',
  ajuste_manual: 'Ajuste manual',
  os: 'Uso em OS',
  venda_balcao: 'Uso em venda de balcão',
  devolucao_fornecedor_defeito: 'Devolução ao fornecedor — defeito',
  devolucao_fornecedor_nfe_cancelada: 'Devolução ao fornecedor — nota fiscal cancelada',
};

function rotuloOrigem(origem: string | null): string {
  if (!origem) return '—';
  return ROTULO_ORIGEM[origem] ?? origem;
}

/** Junta origem (rótulo) + observações — pro ajuste manual, o motivo real mora em observações. */
function descricaoMovimento(m: Movimentacao): string {
  const partes = [rotuloOrigem(m.origem), m.observacoes].filter((p) => p && p !== '—');
  return partes.length > 0 ? partes.join(' — ') : '—';
}

export function MovimentacoesDaPeca({ pecaId, aoRegistrar }: Props) {
  const { temPermissao } = useAuth();
  const podeAjustar = temPermissao('ajustar_estoque');
  const podeDevolverFornecedor = temPermissao('devolver_fornecedor');
  const { confirmar } = useConfirmacao();
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [acaoAberta, setAcaoAberta] = useState<'entrada' | 'ajuste' | 'devolucaoFornecedor' | null>(null);

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
      empresaId: d.empresaId || undefined,
      observacoes: d.observacoes || undefined,
    });
    setAcaoAberta(null);
    await carregar();
    aoRegistrar();
  }

  async function handleSalvarAjuste(d: DadosAjuste) {
    const sinal = d.sentido === 'diminuir' ? -1 : 1;
    const qtd = Number(d.quantidade);
    const ok = await confirmar({
      titulo: 'Confirmar ajuste manual de estoque',
      tom: 'perigo',
      mensagem: [
        `Isso vai ${d.sentido === 'diminuir' ? 'tirar' : 'adicionar'} ${qtd} unidade(s) do saldo direto, fora do fluxo normal de entrada (compra) ou saída (venda/OS).`,
        'Use só pra corrigir uma divergência real (contagem física, perda, quebra) — se for peça saindo pra devolução ao fornecedor, cancele e use o botão "Devolver ao fornecedor" em vez deste.',
        'Confira a quantidade e o motivo antes de confirmar: essa movimentação fica registrada no histórico da peça, mas não tem "desfazer" automático.',
      ],
      textoConfirmar: 'Sim, ajustar estoque',
    });
    if (!ok) return;

    await registrarAjuste({
      pecaId,
      quantidade: sinal * qtd,
      observacoes: d.observacoes,
    });
    setAcaoAberta(null);
    await carregar();
    aoRegistrar();
  }

  async function handleSalvarDevolucao(d: DadosDevolucaoFornecedor) {
    if (!d.motivo) return;
    const ok = await confirmar({
      titulo: 'Confirmar devolução ao fornecedor',
      tom: 'perigo',
      mensagem: [
        `${d.quantidade} unidade(s) vão sair do estoque de novo, como se a compra não tivesse acontecido.`,
        'Certifique-se de que já combinou a troca/estorno da nota com o fornecedor antes de confirmar.',
        'Atenção: isso cobre só o lado do estoque. Se a nota já foi paga, o ajuste no Financeiro (Estornar ou Excluir o lançamento correspondente) precisa ser feito à parte, manualmente.',
      ],
      textoConfirmar: 'Sim, devolver ao fornecedor',
    });
    if (!ok) return;

    await registrarDevolucaoFornecedor({
      pecaId,
      quantidade: Number(d.quantidade),
      motivo: d.motivo,
      fornecedorId: d.fornecedorId || undefined,
      observacoes: d.observacoes || undefined,
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
  if (acaoAberta === 'devolucaoFornecedor') {
    return (
      <FormMovimentacao
        tipo="devolucaoFornecedor"
        onSalvar={handleSalvarDevolucao}
        onCancelar={() => setAcaoAberta(null)}
      />
    );
  }

  return (
    <div className="est-movs">
      <div className="est-movs-head">
        <strong>Movimentações</strong>
        <span className="est-movs-acoes-topo">
          <button type="button" className="est-btn" onClick={() => setAcaoAberta('entrada')}>
            <PackagePlus size={16} aria-hidden="true" /> Entrada
          </button>
          <button
            type="button"
            className="est-btn-sec"
            onClick={() => podeAjustar && setAcaoAberta('ajuste')}
            disabled={!podeAjustar}
            title={podeAjustar ? undefined : 'Essa função requer permissão de ajuste de estoque'}
          >
            <SlidersHorizontal size={15} aria-hidden="true" /> Ajustar
          </button>
          <button
            type="button"
            className="est-btn-sec"
            onClick={() => podeDevolverFornecedor && setAcaoAberta('devolucaoFornecedor')}
            disabled={!podeDevolverFornecedor}
            title={podeDevolverFornecedor ? undefined : 'Essa função requer permissão de devolução ao fornecedor'}
          >
            <PackageMinus size={15} aria-hidden="true" /> Devolver ao fornecedor
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
              <span className="est-movs-obs">{descricaoMovimento(m)}</span>
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
