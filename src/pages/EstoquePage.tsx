/**
 * ============================================================================
 * PÁGINA — ESTOQUE
 * ============================================================================
 * Lista peças com saldo/custo (cache mantido pelo banco). Cada linha pode ser
 * expandida para ver o histórico de movimentações e registrar entrada/ajuste.
 */

import { Fragment, useEffect, useState } from 'react';
import { Search, PackagePlus, Pencil, History, ChevronDown, ChevronUp, FileUp, Ban, RotateCcw } from 'lucide-react';
import {
  type Peca,
  FormPeca,
  MovimentacoesDaPeca,
  listarPecas,
  salvarPeca,
  definirAtivoPeca,
} from '@/features/estoque';
import { ImportarXmlNFe } from '@/features/importacao-nfe';

export function EstoquePage() {
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [mostrarInativas, setMostrarInativas] = useState(false);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarImportarNFe, setMostrarImportarNFe] = useState(false);
  const [pecaEmEdicao, setPecaEmEdicao] = useState<Peca | null>(null);
  const [pecaExpandidaId, setPecaExpandidaId] = useState<string | null>(null);

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

  async function handleSalvar(p: Peca) {
    await salvarPeca(p);
    setMostrarForm(false);
    setPecaEmEdicao(null);
    await carregar();
  }

  async function handleDesativar(id: string) {
    if (!window.confirm('Desativar esta peça? Ela deixa de aparecer nas buscas de venda/OS.')) return;
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

      {carregando && <p>Carregando…</p>}
      {erro && <p className="est-erro">{erro}</p>}

      {!carregando && !erro && (
        <table className="pg-tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Código</th>
              <th>Estoque</th>
              <th>Preço venda</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((p) => (
              <Fragment key={p.id}>
                <tr className={!p.ativo ? 'dsp-linha-inativa' : ''}>
                  <td>
                    {p.nome}
                    {!p.ativo && <span className="dsp-tag-inativa">Inativa</span>}
                  </td>
                  <td>{p.codigo || '—'}</td>
                  <td>
                    {p.qtd} {p.unidade}
                  </td>
                  <td>R$ {Number(p.precoVenda).toFixed(2)}</td>
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
            ))}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={5}>Nenhuma peça encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
