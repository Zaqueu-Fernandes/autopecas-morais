/**
 * ============================================================================
 * PÁGINA — FORNECEDORES
 * ============================================================================
 * Lista, cria e edita fornecedores. Mais simples que Clientes: sem veículos.
 */

import { useEffect, useState } from 'react';
import { Search, Truck, Pencil } from 'lucide-react';
import {
  type Fornecedor,
  FormFornecedor,
  listarFornecedores,
  salvarFornecedor,
} from '@/features/cadastros';

export function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  const [mostrarForm, setMostrarForm] = useState(false);
  const [fornecedorEmEdicao, setFornecedorEmEdicao] = useState<Fornecedor | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setFornecedores(await listarFornecedores());
    } catch {
      setErro('Não foi possível carregar os fornecedores.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSalvar(f: Fornecedor) {
    await salvarFornecedor(f);
    setMostrarForm(false);
    setFornecedorEmEdicao(null);
    await carregar();
  }

  const alvo = busca.trim().toLowerCase();
  const filtrados = fornecedores.filter(
    (f) =>
      !alvo ||
      f.nome.toLowerCase().includes(alvo) ||
      f.telefone.includes(alvo) ||
      f.cnpj.toLowerCase().includes(alvo),
  );

  if (mostrarForm) {
    return (
      <FormFornecedor
        inicial={fornecedorEmEdicao ?? undefined}
        onSalvar={handleSalvar}
        onCancelar={() => {
          setMostrarForm(false);
          setFornecedorEmEdicao(null);
        }}
      />
    );
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Fornecedores</h1>
        <button
          type="button"
          className="cad-btn"
          onClick={() => {
            setFornecedorEmEdicao(null);
            setMostrarForm(true);
          }}
        >
          <Truck size={16} /> Novo fornecedor
        </button>
      </div>

      <div className="pg-busca-wrap">
        <Search size={16} className="pg-busca-icone" />
        <input
          className="pg-busca"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, telefone ou CNPJ…"
        />
      </div>

      {carregando && <p>Carregando…</p>}
      {erro && <p className="cad-erro">{erro}</p>}

      {!carregando && !erro && (
        <table className="pg-tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>CNPJ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((f) => (
              <tr key={f.id}>
                <td>{f.nome}</td>
                <td>{f.telefone || '—'}</td>
                <td>{f.cnpj || '—'}</td>
                <td className="pg-acoes-linha">
                  <button
                    type="button"
                    onClick={() => {
                      setFornecedorEmEdicao(f);
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
                <td colSpan={4}>Nenhum fornecedor encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
