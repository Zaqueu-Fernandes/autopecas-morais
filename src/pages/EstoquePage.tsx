/**
 * ============================================================================
 * PÁGINA — ESTOQUE
 * ============================================================================
 * Lista peças com saldo/custo (cache mantido pelo banco). Cada linha pode ser
 * expandida para ver o histórico de movimentações e registrar entrada/ajuste.
 */

import { Fragment, useEffect, useState } from 'react';
import {
  Search,
  PackagePlus,
  Pencil,
  History,
  ChevronDown,
  ChevronUp,
  FileUp,
  FileDown,
  Ban,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import {
  type Peca,
  FormPeca,
  MovimentacoesDaPeca,
  listarPecas,
  salvarPeca,
  definirAtivoPeca,
} from '@/features/estoque';
import { ImportarXmlNFe } from '@/features/importacao-nfe';
import { CHAVE_URL_XML_NFE, buscarConfiguracao } from '@/features/configuracoes';
import { type DocumentoListaImpressao, BotoesImpressaoLista } from '@/features/impressao';
import { useConfirmacao } from '@/shared/hooks/useConfirmacao';
import { formatarMoeda } from '@/shared/utils/formatadores';

export function EstoquePage() {
  const { confirmar, avisar } = useConfirmacao();
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [mostrarInativas, setMostrarInativas] = useState(false);
  const [urlXmlNfe, setUrlXmlNfe] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarImportarNFe, setMostrarImportarNFe] = useState(false);
  const [pecaEmEdicao, setPecaEmEdicao] = useState<Peca | null>(null);
  const [pecaExpandidaId, setPecaExpandidaId] = useState<string | null>(null);
  const [ordemEstoque, setOrdemEstoque] = useState<'asc' | 'desc' | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setPecas(await listarPecas({ somenteAtivas: !mostrarInativas }));
    } catch {
      setErro('Não foi possível carregar as peças.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarInativas]);

  useEffect(() => {
    buscarConfiguracao(CHAVE_URL_XML_NFE)
      .then(setUrlXmlNfe)
      .catch(() => setUrlXmlNfe(null));
  }, []);

  async function handleBaixarXmlNfe() {
    if (!urlXmlNfe) {
      await avisar({
        titulo: 'URL ainda não configurada',
        tom: 'aviso',
        mensagem:
          'Peça pro admin cadastrar o link do serviço de consulta de NF-e em Admin > URL para baixar XML.',
      });
      return;
    }
    window.open(urlXmlNfe, '_blank', 'noopener,noreferrer');
  }

  async function handleSalvar(p: Peca) {
    await salvarPeca(p);
    setMostrarForm(false);
    setPecaEmEdicao(null);
    await carregar();
  }

  async function handleDesativar(id: string) {
    const ok = await confirmar({
      titulo: 'Desativar esta peça?',
      tom: 'aviso',
      mensagem: [
        'Ela deixa de aparecer nas buscas de venda/OS, mas o histórico de movimentações e o cadastro continuam intactos.',
        'É reversível: dá pra reativar a qualquer momento pela lista (ative "Mostrar inativas").',
      ],
      textoConfirmar: 'Desativar peça',
    });
    if (!ok) return;
    await definirAtivoPeca(id, false);
    await carregar();
  }

  async function handleReativar(id: string) {
    await definirAtivoPeca(id, true);
    await carregar();
  }

  const alvo = busca.trim().toLowerCase();
  const filtradas = pecas.filter(
    (p) => !alvo || p.nome.toLowerCase().includes(alvo) || p.codigo.toLowerCase().includes(alvo),
  );
  const listaOrdenada = ordemEstoque
    ? [...filtradas].sort((a, b) => (ordemEstoque === 'asc' ? a.qtd - b.qtd : b.qtd - a.qtd))
    : filtradas;

  function alternarOrdemEstoque() {
    setOrdemEstoque((o) => (o === 'asc' ? 'desc' : o === 'desc' ? null : 'asc'));
  }

  const documentoImpressao: DocumentoListaImpressao = {
    titulo: 'Estoque',
    colunas: ['Nome', 'Código', 'Estoque', 'Preço venda'],
    linhas: filtradas.map((p) => [
      p.nome,
      p.codigo || '—',
      `${p.qtd} ${p.unidade}`,
      formatarMoeda(Number(p.precoVenda)),
    ]),
  };

  if (mostrarForm) {
    return (
      <FormPeca
        inicial={pecaEmEdicao ?? undefined}
        onSalvar={handleSalvar}
        onCancelar={() => {
          setMostrarForm(false);
          setPecaEmEdicao(null);
        }}
      />
    );
  }

  if (mostrarImportarNFe) {
    return (
      <ImportarXmlNFe
        aoConcluir={async () => {
          setMostrarImportarNFe(false);
          await carregar();
        }}
        aoCancelar={() => setMostrarImportarNFe(false)}
      />
    );
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Estoque</h1>
        <div className="pg-head-acoes">
          <BotoesImpressaoLista documento={documentoImpressao} className="est-btn-sec" />
          <button
            type="button"
            className="est-btn-sec"
            onClick={handleBaixarXmlNfe}
            title="Para baixar o XML você deve ter em mãos o código da chave de acesso da Nota Fiscal"
          >
            <FileDown size={16} /> Baixar XML de Nota Fiscal
          </button>
          <button type="button" className="est-btn-sec" onClick={() => setMostrarImportarNFe(true)}>
            <FileUp size={16} /> Importar XML
          </button>
          <button
            type="button"
            className="est-btn"
            onClick={() => {
              setPecaEmEdicao(null);
              setMostrarForm(true);
            }}
          >
            <PackagePlus size={16} /> Nova peça
          </button>
        </div>
      </div>

      <div className="pg-busca-wrap">
        <Search size={16} className="pg-busca-icone" />
        <input
          className="pg-busca"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou código…"
          aria-label="Buscar peça"
          type="search"
          autoComplete="off"
        />
      </div>

      <div className="pg-filtros">
        <label className="dsp-filtro-inativas">
          <input
            type="checkbox"
            checked={mostrarInativas}
            onChange={(e) => setMostrarInativas(e.target.checked)}
          />
          Mostrar inativas
        </label>
      </div>

      {carregando && <p aria-live="polite">Carregando…</p>}
      {erro && <p className="est-erro" aria-live="polite">{erro}</p>}

      {!carregando && !erro && (
        <div className="pg-tabela-wrap">
        <table className="pg-tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Código</th>
              <th>
                <button type="button" className="pg-th-ordenavel" onClick={alternarOrdemEstoque}>
                  Estoque
                  {ordemEstoque === 'asc' && <ArrowUp size={12} />}
                  {ordemEstoque === 'desc' && <ArrowDown size={12} />}
                  {ordemEstoque === null && <ArrowUpDown size={12} />}
                </button>
              </th>
              <th>Preço venda</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {listaOrdenada.map((p) => {
              const estoqueMinimo = Number(p.estoqueMinimo);
              const monitorada = estoqueMinimo > 0;
              const estoqueBaixo = monitorada && p.qtd <= estoqueMinimo;
              return (
              <Fragment key={p.id}>
                <tr className={!p.ativo ? 'dsp-linha-inativa' : ''}>
                  <td className="pg-tabela-truncar">
                    {p.nome}
                    {!p.ativo && <span className="dsp-tag-inativa">Inativa</span>}
                  </td>
                  <td>{p.codigo || '—'}</td>
                  <td>
                    {monitorada && (
                      <span
                        className={`est-semaforo ${estoqueBaixo ? 'est-semaforo-baixo' : 'est-semaforo-ok'}`}
                        title={`Estoque mínimo: ${estoqueMinimo}`}
                        aria-hidden="true"
                      />
                    )}
                    {p.qtd} {p.unidade}
                  </td>
                  <td>{formatarMoeda(Number(p.precoVenda))}</td>
                  <td className="pg-acoes-linha">
                    <button
                      type="button"
                      onClick={() => {
                        setPecaEmEdicao(p);
                        setMostrarForm(true);
                      }}
                    >
                      <Pencil size={13} /> Editar
                    </button>
                    {p.ativo ? (
                      <button type="button" onClick={() => handleDesativar(p.id!)}>
                        <Ban size={13} /> Desativar
                      </button>
                    ) : (
                      <button type="button" onClick={() => handleReativar(p.id!)}>
                        <RotateCcw size={13} /> Reativar
                      </button>
                    )}
                    <button
                      type="button"
                      aria-expanded={pecaExpandidaId === p.id}
                      onClick={() => setPecaExpandidaId(pecaExpandidaId === p.id ? null : p.id!)}
                    >
                      <History size={13} /> Movimentações
                      {pecaExpandidaId === p.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </td>
                </tr>
                {pecaExpandidaId === p.id && (
                  <tr>
                    <td colSpan={5} className="pg-linha-expandida">
                      <MovimentacoesDaPeca pecaId={p.id!} aoRegistrar={carregar} />
                    </td>
                  </tr>
                )}
              </Fragment>
              );
            })}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={5}>Nenhuma peça encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
