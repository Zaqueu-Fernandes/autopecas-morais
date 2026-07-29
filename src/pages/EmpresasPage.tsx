/**
 * ============================================================================
 * PÁGINA — EMPRESAS
 * ============================================================================
 * Cadastro de empresas (CNPJs/MEIs) da oficina. Clientes, estoque e OS
 * continuam compartilhados entre elas — só o financeiro (faturamento,
 * despesas) é separado por empresa, pra dar pra monitorar o limite do MEI
 * de cada CNPJ individualmente (ver Dashboard).
 */

import { useEffect, useState } from 'react';
import { Building2, Pencil } from 'lucide-react';
import {
  type Empresa,
  empresaVazia,
  FormEmpresa,
  listarEmpresas,
  salvarEmpresa,
  ROTULO_REGIME,
} from '@/features/empresa';
import { type DocumentoListaImpressao, BotoesImpressaoLista } from '@/features/impressao';
import { formatarMoeda } from '@/shared/utils/formatadores';

export function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [empresaEmEdicao, setEmpresaEmEdicao] = useState<Empresa | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setEmpresas(await listarEmpresas());
    } catch {
      setErro('Não foi possível carregar as empresas.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const documentoImpressao: DocumentoListaImpressao = {
    titulo: 'Empresas',
    colunas: ['Nome', 'CNPJ', 'Regime', 'Limite anual MEI'],
    linhas: empresas.map((e) => [
      e.nomeFantasia,
      e.cnpj || '—',
      ROTULO_REGIME[e.regime],
      e.regime === 'MEI' ? formatarMoeda(Number(e.limiteAnualMei)) : '—',
    ]),
  };

  async function handleSalvar(e: Empresa) {
    await salvarEmpresa(e);
    setMostrarForm(false);
    setEmpresaEmEdicao(null);
    await carregar();
  }

  if (mostrarForm) {
    return (
      <FormEmpresa
        inicial={empresaEmEdicao ?? empresaVazia()}
        onSalvar={handleSalvar}
        onCancelar={() => {
          setMostrarForm(false);
          setEmpresaEmEdicao(null);
        }}
      />
    );
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Empresas</h1>
        <div className="pg-head-acoes">
          <BotoesImpressaoLista documento={documentoImpressao} className="emp-btn-sec" />
          <button
            type="button"
            className="emp-btn"
            onClick={() => {
              setEmpresaEmEdicao(null);
              setMostrarForm(true);
            }}
          >
            <Building2 size={16} /> Nova empresa
          </button>
        </div>
      </div>

      {empresas.length === 0 && !carregando && !erro && (
        <p className="emp-dica">
          Nenhuma empresa cadastrada ainda. Cadastre pelo menos uma pra faturar OS/vendas e
          acompanhar o limite do MEI no Dashboard.
        </p>
      )}

      {carregando && <p aria-live="polite">Carregando…</p>}
      {erro && <p className="emp-erro" aria-live="polite">{erro}</p>}

      {!carregando && !erro && empresas.length > 0 && (
        <div className="pg-tabela-wrap">
        <table className="pg-tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>CNPJ</th>
              <th>Regime</th>
              <th>Limite anual MEI</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {empresas.map((e) => (
              <tr key={e.id}>
                <td>{e.nomeFantasia}</td>
                <td>{e.cnpj || '—'}</td>
                <td>{ROTULO_REGIME[e.regime]}</td>
                <td>{e.regime === 'MEI' ? formatarMoeda(Number(e.limiteAnualMei)) : '—'}</td>
                <td className="pg-acoes-linha">
                  <button
                    type="button"
                    onClick={() => {
                      setEmpresaEmEdicao(e);
                      setMostrarForm(true);
                    }}
                  >
                    <Pencil size={13} /> Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
