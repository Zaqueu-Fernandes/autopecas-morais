/**
 * ============================================================================
 * PÁGINA — CLIENTES
 * ============================================================================
 * Lista, cria e edita clientes. Cada linha pode ser expandida para ver/gerenciar
 * os veículos daquele cliente (feature VeiculosDoCliente).
 */

import { Fragment, useEffect, useState } from 'react';
import { Search, UserPlus, Pencil, CarFront, ChevronDown, ChevronUp } from 'lucide-react';
import {
  type Cliente,
  FormCliente,
  VeiculosDoCliente,
  listarClientes,
  salvarCliente,
} from '@/features/cadastros';
import { type DocumentoListaImpressao, BotoesImpressaoLista } from '@/features/impressao';

export function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  const [mostrarForm, setMostrarForm] = useState(false);
  const [clienteEmEdicao, setClienteEmEdicao] = useState<Cliente | null>(null);
  const [clienteExpandidoId, setClienteExpandidoId] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setClientes(await listarClientes());
    } catch {
      setErro('Não foi possível carregar os clientes.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSalvar(c: Cliente) {
    await salvarCliente(c);
    setMostrarForm(false);
    setClienteEmEdicao(null);
    await carregar();
  }

  const alvo = busca.trim().toLowerCase();
  const filtrados = clientes.filter(
    (c) =>
      !alvo ||
      c.nome.toLowerCase().includes(alvo) ||
      c.telefone.includes(alvo) ||
      c.documento.toLowerCase().includes(alvo),
  );

  const documentoImpressao: DocumentoListaImpressao = {
    titulo: 'Clientes',
    colunas: ['Nome', 'Telefone', 'Documento'],
    linhas: filtrados.map((c) => [c.nome, c.telefone || '—', c.documento || '—']),
  };

  if (mostrarForm) {
    return (
      <FormCliente
        inicial={clienteEmEdicao ?? undefined}
        onSalvar={handleSalvar}
        onCancelar={() => {
          setMostrarForm(false);
          setClienteEmEdicao(null);
        }}
      />
    );
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Clientes</h1>
        <div className="pg-head-acoes">
          <BotoesImpressaoLista documento={documentoImpressao} className="cad-btn-sec" />
          <button
            type="button"
            className="cad-btn"
            onClick={() => {
              setClienteEmEdicao(null);
              setMostrarForm(true);
            }}
          >
            <UserPlus size={16} /> Novo cliente
          </button>
        </div>
      </div>

      <div className="pg-busca-wrap">
        <Search size={16} className="pg-busca-icone" />
        <input
          className="pg-busca"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, telefone ou documento…"
          aria-label="Buscar cliente"
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
              <th>Documento</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c) => {
              const expandido = clienteExpandidoId === c.id;
              return (
                <Fragment key={c.id}>
                  <tr>
                    <td className="pg-tabela-truncar">{c.nome}</td>
                    <td>{c.telefone || '—'}</td>
                    <td>{c.documento || '—'}</td>
                    <td className="pg-acoes-linha">
                      <button
                        type="button"
                        onClick={() => {
                          setClienteEmEdicao(c);
                          setMostrarForm(true);
                        }}
                      >
                        <Pencil size={13} /> Editar
                      </button>
                      <button
                        type="button"
                        aria-expanded={expandido}
                        onClick={() => setClienteExpandidoId(expandido ? null : c.id!)}
                      >
                        <CarFront size={13} /> Veículos
                        {expandido ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </td>
                  </tr>
                  {expandido && (
                    <tr>
                      <td colSpan={4} className="pg-linha-expandida">
                        <VeiculosDoCliente clienteId={c.id!} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={4}>Nenhum cliente encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
