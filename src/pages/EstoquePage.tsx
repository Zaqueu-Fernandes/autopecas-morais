/**
 * ============================================================================
 * PÁGINA — ESTOQUE
 * ============================================================================
 * Lista peças com saldo/custo (cache mantido pelo banco). Cada linha pode ser
 * expandida para ver o histórico de movimentações e registrar entrada/ajuste.
 */

import { Fragment, useEffect, useState } from 'react';
import {
  type Peca,
  FormPeca,
  MovimentacoesDaPeca,
  listarPecas,
  salvarPeca,
} from '@/features/estoque';

export function EstoquePage() {
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  const [mostrarForm, setMostrarForm] = useState(false);
  const [pecaEmEdicao, setPecaEmEdicao] = useState<Peca | null>(null);
  const [pecaExpandidaId, setPecaExpandidaId] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setPecas(await listarPecas());
    } catch {
      setErro('Não foi possível carregar as peças.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSalvar(p: Peca) {
    await salvarPeca(p);
    setMostrarForm(false);
    setPecaEmEdicao(null);
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

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Estoque</h1>
        <button
          type="button"
          className="est-btn"
          onClick={() => {
            setPecaEmEdicao(null);
            setMostrarForm(true);
          }}
        >
          + Nova peça
        </button>
      </div>

      <input
        className="pg-busca"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome ou código…"
      />

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
                <tr>
                  <td>{p.nome}</td>
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
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setPecaExpandidaId(pecaExpandidaId === p.id ? null : p.id!)}
                    >
                      {pecaExpandidaId === p.id ? 'Ocultar movimentações' : 'Movimentações'}
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
