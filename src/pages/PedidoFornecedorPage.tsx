/**
 * ============================================================================
 * PÁGINA — FAZER PEDIDO (ao fornecedor)
 * ============================================================================
 * Gera um documento de pedido de compra (peça + quantidade), pré-populado
 * com as peças no estoque mínimo — sem gravar nada no banco (decisão
 * consciente, ver CLAUDE.md: é um gerador de documento, não um cadastro de
 * "pedidos"; pra rastrear de verdade o que chegou, a Entrada de estoque
 * continua sendo o registro oficial). Três telas trocadas por `useState`,
 * mesmo idioma do resto do app (ver ImportarXmlNFe): 'inicio' → 'revisar' →
 * 'concluido'.
 */

import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { buscarPecasEstoqueBaixo, type PecaEstoqueBaixo } from '@/features/estoque';
import { FormPedidoFornecedor, type ItemPedido } from '@/features/pedido-fornecedor';
import { type DocumentoListaImpressao, BotoesImpressaoLista } from '@/features/impressao';

type Etapa = 'inicio' | 'revisar' | 'concluido';

export function PedidoFornecedorPage() {
  const [etapa, setEtapa] = useState<Etapa>('inicio');
  const [pecasBaixo, setPecasBaixo] = useState<PecaEstoqueBaixo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [fornecedorNome, setFornecedorNome] = useState('');
  const [itensGerados, setItensGerados] = useState<ItemPedido[]>([]);

  useEffect(() => {
    buscarPecasEstoqueBaixo()
      .then(setPecasBaixo)
      .catch(() => setPecasBaixo([]))
      .finally(() => setCarregando(false));
  }, []);

  function handleIniciar() {
    const itensIniciais: ItemPedido[] = pecasBaixo.map((p) => ({
      pecaId: p.id,
      nome: p.nome,
      codigo: p.codigo ?? '',
      unidade: p.unidade,
      qtdAtual: p.qtd,
      estoqueMinimo: p.estoqueMinimo,
      quantidade: String(Math.max(p.estoqueMinimo - p.qtd, 1)),
    }));
    setItensGerados(itensIniciais);
    setEtapa('revisar');
  }

  function handleGerar(nome: string, itens: ItemPedido[]) {
    setFornecedorNome(nome);
    setItensGerados(itens);
    setEtapa('concluido');
  }

  function handleNovoPedido() {
    setItensGerados([]);
    setFornecedorNome('');
    setEtapa('inicio');
    setCarregando(true);
    buscarPecasEstoqueBaixo()
      .then(setPecasBaixo)
      .catch(() => setPecasBaixo([]))
      .finally(() => setCarregando(false));
  }

  if (etapa === 'revisar') {
    return (
      <div className="pg">
        <div className="pg-head">
          <h1>Fazer Pedido ao Fornecedor</h1>
        </div>
        <FormPedidoFornecedor
          itensIniciais={itensGerados}
          onGerar={handleGerar}
          onCancelar={() => setEtapa('inicio')}
        />
      </div>
    );
  }

  if (etapa === 'concluido') {
    const documentoImpressao: DocumentoListaImpressao = {
      titulo: 'Pedido de Compra',
      subtitulo: `Fornecedor: ${fornecedorNome} — ${new Date().toLocaleDateString('pt-BR')}`,
      colunas: ['Peça', 'Código', 'Estoque atual', 'Estoque mínimo', 'Qtd. pedida'],
      linhas: itensGerados.map((i) => [
        i.nome,
        i.codigo || '—',
        `${i.qtdAtual} ${i.unidade}`,
        i.estoqueMinimo ? `${i.estoqueMinimo} ${i.unidade}` : '—',
        `${i.quantidade} ${i.unidade}`,
      ]),
    };

    return (
      <div className="pg">
        <div className="pg-head">
          <h1>Fazer Pedido ao Fornecedor</h1>
          <div className="pg-head-acoes">
            <BotoesImpressaoLista documento={documentoImpressao} className="ped-btn-sec" />
            <button type="button" className="ped-btn" onClick={handleNovoPedido}>
              Fazer outro pedido
            </button>
          </div>
        </div>

        <p className="ped-intro">
          Pedido pronto para <strong>{fornecedorNome}</strong>. Use "Imprimir" ou "Gerar PDF" para
          enviar ao fornecedor — nada foi salvo no sistema.
        </p>

        <div className="ped-resumo pg-tabela-wrap">
          <table className="pg-tabela">
            <thead>
              <tr>
                <th>Peça</th>
                <th>Código</th>
                <th>Estoque atual</th>
                <th>Estoque mínimo</th>
                <th>Qtd. pedida</th>
              </tr>
            </thead>
            <tbody>
              {itensGerados.map((i) => (
                <tr key={i.pecaId}>
                  <td className="pg-tabela-truncar">{i.nome}</td>
                  <td>{i.codigo || '—'}</td>
                  <td>
                    {i.qtdAtual} {i.unidade}
                  </td>
                  <td>{i.estoqueMinimo ? `${i.estoqueMinimo} ${i.unidade}` : '—'}</td>
                  <td>
                    {i.quantidade} {i.unidade}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Fazer Pedido ao Fornecedor</h1>
      </div>

      <p className="ped-intro">
        Monte um pedido de compra para um fornecedor — a lista já começa com as peças que
        atingiram o estoque mínimo, e dá para adicionar ou remover peças antes de gerar o
        documento (imprimir ou baixar em PDF).
      </p>

      {carregando && <p aria-live="polite">Carregando…</p>}

      {!carregando && (
        <p className="ped-intro">
          {pecasBaixo.length === 0
            ? 'Nenhuma peça está no estoque mínimo agora — o pedido começa em branco, é só adicionar as peças manualmente.'
            : `${pecasBaixo.length} peça(s) no estoque mínimo — vão entrar pré-preenchidas no pedido.`}
        </p>
      )}

      <button type="button" className="ped-btn" onClick={handleIniciar} disabled={carregando}>
        <ClipboardList size={16} /> Fazer Pedido
      </button>
    </div>
  );
}
