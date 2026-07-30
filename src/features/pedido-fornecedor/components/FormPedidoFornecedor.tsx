/**
 * ============================================================================
 * REVISÃO DO PEDIDO AO FORNECEDOR
 * ============================================================================
 * Lista editável (pré-populada com o alerta de estoque mínimo, ver
 * PedidoFornecedorPage) — dá pra remover peça, editar a quantidade pedida, e
 * adicionar qualquer outra peça do estoque (não só as que estão no mínimo).
 * Sem gravação no banco: "Gerar Pedido" só valida e devolve os dados pra
 * página montar o documento de impressão/PDF.
 */

import { useEffect, useState } from 'react';
import { PackagePlus, X } from 'lucide-react';
import { type ItemPedido, type ErrosValidacao, semErros } from '../types';
import { type Fornecedor, listarFornecedores } from '@/features/cadastros';
import { type Peca, listarPecas } from '@/features/estoque';
import { paraNumero } from '@/shared/utils/formatadores';

interface Props {
  itensIniciais: ItemPedido[];
  onGerar: (fornecedorNome: string, itens: ItemPedido[]) => void;
  onCancelar: () => void;
}

export function FormPedidoFornecedor({ itensIniciais, onGerar, onCancelar }: Props) {
  const [itens, setItens] = useState<ItemPedido[]>(itensIniciais);
  const [fornecedorId, setFornecedorId] = useState('');
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [pecaParaAdicionar, setPecaParaAdicionar] = useState('');
  const [qtdParaAdicionar, setQtdParaAdicionar] = useState('');
  const [erros, setErros] = useState<ErrosValidacao>({});

  useEffect(() => {
    listarFornecedores().then(setFornecedores).catch(() => setFornecedores([]));
    listarPecas().then(setPecas).catch(() => setPecas([]));
  }, []);

  function atualizarQuantidade(pecaId: string, quantidade: string) {
    setItens((lista) => lista.map((i) => (i.pecaId === pecaId ? { ...i, quantidade } : i)));
  }

  function removerItem(pecaId: string) {
    setItens((lista) => lista.filter((i) => i.pecaId !== pecaId));
  }

  function handleAdicionar() {
    const e: ErrosValidacao = {};
    if (!pecaParaAdicionar) e.pecaParaAdicionar = 'Selecione uma peça.';
    const qtd = paraNumero(qtdParaAdicionar);
    if (!qtdParaAdicionar.trim() || Number.isNaN(qtd) || qtd <= 0) e.qtdParaAdicionar = 'Informe uma quantidade maior que zero.';
    setErros((atual) => ({ ...atual, ...e }));
    if (!semErros(e)) return;

    const peca = pecas.find((p) => p.id === pecaParaAdicionar);
    if (!peca) return;

    setItens((lista) => [
      ...lista,
      {
        pecaId: peca.id!,
        nome: peca.nome,
        codigo: peca.codigo,
        unidade: peca.unidade,
        qtdAtual: peca.qtd,
        estoqueMinimo: Number(peca.estoqueMinimo),
        quantidade: qtdParaAdicionar,
      },
    ]);
    setPecaParaAdicionar('');
    setQtdParaAdicionar('');
    setErros((atual) => ({ ...atual, pecaParaAdicionar: '', qtdParaAdicionar: '' }));
  }

  function handleGerar() {
    const e: ErrosValidacao = {};
    if (!fornecedorId) e.fornecedorId = 'Selecione o fornecedor.';
    if (itens.length === 0) e.itens = 'Adicione pelo menos uma peça ao pedido.';
    for (const item of itens) {
      const qtd = paraNumero(item.quantidade);
      if (!item.quantidade.trim() || Number.isNaN(qtd) || qtd <= 0) {
        e.itens = 'Todas as peças precisam de uma quantidade maior que zero.';
        break;
      }
    }
    setErros(e);
    if (!semErros(e)) return;

    const fornecedor = fornecedores.find((f) => f.id === fornecedorId)!;
    onGerar(fornecedor.nome, itens);
  }

  const pecasDisponiveis = pecas.filter((p) => !itens.some((i) => i.pecaId === p.id));

  return (
    <div className="ped-form">
      <div className="ped-form-head">
        <h2>Revisar pedido</h2>
      </div>

      <div className="ped-campo ped-campo-fornecedor">
        <label htmlFor="ped-fornecedor">Fornecedor *</label>
        <select
          id="ped-fornecedor"
          value={fornecedorId}
          onChange={(e) => setFornecedorId(e.target.value)}
          aria-invalid={!!erros.fornecedorId}
        >
          <option value="">— selecione —</option>
          {fornecedores.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
        {erros.fornecedorId && <span className="ped-erro">{erros.fornecedorId}</span>}
      </div>

      <div className="pg-tabela-wrap">
        <table className="pg-tabela">
          <thead>
            <tr>
              <th>Peça</th>
              <th>Código</th>
              <th>Estoque atual</th>
              <th>Estoque mínimo</th>
              <th>Qtd. pedida</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.pecaId}>
                <td className="pg-tabela-truncar">{item.nome}</td>
                <td>{item.codigo || '—'}</td>
                <td>
                  {item.qtdAtual} {item.unidade}
                </td>
                <td>{item.estoqueMinimo || '—'}</td>
                <td>
                  <input
                    className="ped-input-qtd"
                    inputMode="numeric"
                    value={item.quantidade}
                    onChange={(e) => atualizarQuantidade(item.pecaId, e.target.value)}
                    aria-label={`Quantidade pedida de ${item.nome}`}
                  />
                </td>
                <td className="pg-acoes-linha">
                  <button type="button" onClick={() => removerItem(item.pecaId)}>
                    <X size={13} /> Remover
                  </button>
                </td>
              </tr>
            ))}
            {itens.length === 0 && (
              <tr>
                <td colSpan={6}>Nenhuma peça no pedido ainda — adicione abaixo.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {erros.itens && <span className="ped-erro">{erros.itens}</span>}

      <div className="ped-adicionar">
        <div className="ped-campo ped-campo-peca">
          <label htmlFor="ped-add-peca">Adicionar peça</label>
          <select
            id="ped-add-peca"
            value={pecaParaAdicionar}
            onChange={(e) => setPecaParaAdicionar(e.target.value)}
            aria-invalid={!!erros.pecaParaAdicionar}
          >
            <option value="">— selecione —</option>
            {pecasDisponiveis.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} (estoque: {p.qtd} {p.unidade})
              </option>
            ))}
          </select>
          {erros.pecaParaAdicionar && <span className="ped-erro">{erros.pecaParaAdicionar}</span>}
        </div>
        <div className="ped-campo">
          <label htmlFor="ped-add-qtd">Quantidade</label>
          <input
            id="ped-add-qtd"
            inputMode="numeric"
            value={qtdParaAdicionar}
            onChange={(e) => setQtdParaAdicionar(e.target.value)}
            aria-invalid={!!erros.qtdParaAdicionar}
          />
          {erros.qtdParaAdicionar && <span className="ped-erro">{erros.qtdParaAdicionar}</span>}
        </div>
        <button type="button" className="ped-btn-sec" onClick={handleAdicionar}>
          <PackagePlus size={15} /> Adicionar
        </button>
      </div>

      <div className="ped-acoes">
        <button type="button" className="ped-btn-sec" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="button" className="ped-btn" onClick={handleGerar}>
          Gerar Pedido
        </button>
      </div>
    </div>
  );
}
