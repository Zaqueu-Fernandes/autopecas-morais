/**
 * ============================================================================
 * PÁGINA — CREDORES
 * ============================================================================
 * Lista, cria e edita credores. Mesmo padrão de FornecedoresPage.
 */

import { useEffect, useState } from 'react';
import { Search, UserRound, Pencil } from 'lucide-react';
import {
  type Credor,
  FormCredor,
  listarCredores,
  salvarCredor,
} from '@/features/cadastros';
import { type DocumentoListaImpressao, BotoesImpressaoLista } from '@/features/impressao';

export function CredoresPage() {
  const [credores, setCredores] = useState<Credor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  const [mostrarForm, setMostrarForm] = useState(false);
  const [credorEmEdicao, setCredorEmEdicao] = useState<Credor | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setCredores(await listarCredores());
    } catch {
      setErro('Não foi possível carregar os credores.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSalvar(c: Credor) {
    await salvarCredor(c);
    setMostrarForm(false);
    setCredorEmEdicao(null);
    await carregar();
  }

  const alvo = busca.trim().toLowerCase();
  const filtrados = credores.filter(
    (c) =>
      !alvo ||
      c.nome.toLowerCase().includes(alvo) ||
      c.telefone.includes(alvo) ||
      c.documento.toLowerCase().includes(alvo),
  );

  const documentoImpressao: DocumentoListaImpressao = {
    titulo: 'Credores',
    colunas: ['Nome', 'Telefone', 'CPF/CNPJ'],
    linhas: filtrados.map((c) => [c.nome, c.telefone || '—', c.documento || '—']),
  };

  if (mostrarForm) {
    return (
      <FormCredor
        inicial={credorEmEdicao ?? undefined}
        onSalvar={handleSalvar}
        onCancelar={() => {
          setMostrarForm(false);
          setCredorEmEdicao(null);
        }}
      />
    );
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Credores</h1>
        <div className="pg-head-acoes">
          <BotoesImpressaoLista documento={documentoImpressao} className="cad-btn-sec" />
          <button
            type="button"
            className="cad-btn"
            onClick={() => {
              setCredorEmEdicao(null);
              setMostrarForm(true);
            }}
          >
            <UserRound size={16} /> Novo credor
          </button>
        </div>
      </div>

      <div className="pg-busca-wrap">
        <Search size={16} className="pg-busca-icone" />
        <input
          className="pg-busca"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, telefone ou CPF/CNPJ…"
          aria-label="Buscar credor"
          type="search"
          autoComplete="off"
        />
      </div>

      {carregando && <p aria-live="polite">Carregando…</p>}
      {erro && <p className="cad-erro" aria-live="polite">{erro}</p>}

      {!carregando && !erro && (
        <div className="pg-tabela-wrap">
        <table className="pg-tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>CPF/CNPJ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c) => (
              <tr key={c.id}>
                <td className="pg-tabela-truncar">{c.nome}</td>
                <td>{c.telefone || '—'}</td>
                <td>{c.documento || '—'}</td>
                <td className="pg-acoes-linha">
                  <button
                    type="button"
                    onClick={() => {
                      setCredorEmEdicao(c);
                      setMostrarForm(true);
                    }}
                  >
                    <Pencil size={13} /> Editar
                  </button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={4}>Nenhum credor encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
