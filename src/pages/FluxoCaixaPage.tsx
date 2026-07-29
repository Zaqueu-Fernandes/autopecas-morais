/**
 * ============================================================================
 * PÁGINA — FLUXO DE CAIXA
 * ============================================================================
 * Dinheiro que realmente entrou/saiu num período (lançamentos já quitados),
 * com saldo acumulado. Diferente do Dashboard, que conta faturamento pela
 * data da venda/OS, não da quitação.
 */

import { useEffect, useState } from 'react';
import { History, TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import {
  type ResultadoFluxoCaixa,
  type CategoriaReceber,
  buscarFluxoCaixa,
  ROTULO_CATEGORIA_RECEBER,
} from '@/features/financeiro';
import { type Empresa, listarEmpresas } from '@/features/empresa';
import { type Categoria, listarCategorias } from '@/features/categorias';
import { type DocumentoListaImpressao, BotoesImpressaoLista } from '@/features/impressao';
import { CartaoResumo } from '@/features/dashboard';
import { formatarMoeda } from '@/shared/utils/formatadores';

function primeiroDiaDoMes(): string {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
}

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function rotuloCategoria(tipo: 'pagar' | 'receber', categoria: string, categorias: Categoria[]): string {
  if (tipo === 'receber') return ROTULO_CATEGORIA_RECEBER[categoria as CategoriaReceber];
  return categorias.find((c) => c.chave === categoria)?.nome ?? categoria;
}

export function FluxoCaixaPage() {
  const [inicio, setInicio] = useState(primeiroDiaDoMes());
  const [fim, setFim] = useState(hojeISO());
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [empresaId, setEmpresaId] = useState('');
  const [resultado, setResultado] = useState<ResultadoFluxoCaixa | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarEmpresas().then((lista) => {
      setEmpresas(lista);
      if (lista.length > 0) setEmpresaId((atual) => atual || lista[0].id!);
    });
    listarCategorias({ somenteAtivas: false }).then(setCategorias);
  }, []);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setResultado(await buscarFluxoCaixa(inicio, fim, empresaId || undefined));
    } catch {
      setErro('Não foi possível carregar o fluxo de caixa.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicio, fim, empresaId]);

  const documentoImpressao: DocumentoListaImpressao = {
    titulo: 'Fluxo de Caixa',
    subtitulo: `${new Date(inicio).toLocaleDateString('pt-BR')} a ${new Date(fim).toLocaleDateString('pt-BR')}`,
    colunas: ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Saldo acumulado'],
    linhas: (resultado?.movimentos ?? []).map((m) => [
      new Date(m.dataPagamento).toLocaleDateString('pt-BR'),
      m.tipo === 'pagar' ? 'Saída' : 'Entrada',
      rotuloCategoria(m.tipo, m.categoria, categorias),
      m.descricao,
      `${m.tipo === 'pagar' ? '-' : '+'} ${formatarMoeda(m.valor)}`,
      formatarMoeda(m.saldoAcumulado),
    ]),
  };

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Fluxo de Caixa</h1>
        <div className="pg-head-acoes">
          <BotoesImpressaoLista documento={documentoImpressao} className="fin-btn-sec" />
        </div>
      </div>

      <div className="pg-filtros">
        <select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} aria-label="Filtrar por empresa">
          {empresas.length === 0 && <option value="">Nenhuma empresa cadastrada</option>}
          {empresas.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.nomeFantasia}
            </option>
          ))}
        </select>
        <label className="fin-campo-inline">
          De
          <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </label>
        <label className="fin-campo-inline">
          Até
          <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
        </label>
      </div>

      {carregando && <p aria-live="polite">Carregando…</p>}
      {erro && <p className="fin-erro" aria-live="polite">{erro}</p>}

      {!carregando && !erro && resultado && (
        <>
          <div className="dash-grid">
            <CartaoResumo
              titulo="Saldo anterior"
              valor={formatarMoeda(resultado.saldoAnterior)}
              icone={<History size={15} />}
            />
            <CartaoResumo
              titulo="Entradas no período"
              valor={formatarMoeda(resultado.totalEntradas)}
              icone={<ArrowDownCircle size={15} />}
            />
            <CartaoResumo
              titulo="Saídas no período"
              valor={formatarMoeda(resultado.totalSaidas)}
              icone={<ArrowUpCircle size={15} />}
            />
            <CartaoResumo
              titulo="Saldo final"
              valor={formatarMoeda(resultado.saldoFinal)}
              tom={resultado.saldoFinal < 0 ? 'perigo' : 'neutro'}
              icone={resultado.saldoFinal < 0 ? <TrendingDown size={15} /> : <TrendingUp size={15} />}
            />
          </div>

          <div className="pg-tabela-wrap">
          <table className="pg-tabela">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Saldo acumulado</th>
              </tr>
            </thead>
            <tbody>
              {resultado.movimentos.map((m) => (
                <tr key={m.id}>
                  <td>{new Date(m.dataPagamento).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <span className={`fin-badge-tipo fin-badge-${m.tipo}`}>
                      {m.tipo === 'pagar' ? 'Saída' : 'Entrada'}
                    </span>
                  </td>
                  <td>{rotuloCategoria(m.tipo, m.categoria, categorias)}</td>
                  <td className="pg-tabela-truncar">{m.descricao}</td>
                  <td>
                    {m.tipo === 'pagar' ? '-' : '+'} {formatarMoeda(m.valor)}
                  </td>
                  <td>{formatarMoeda(m.saldoAcumulado)}</td>
                </tr>
              ))}
              {resultado.movimentos.length === 0 && (
                <tr>
                  <td colSpan={6}>Nenhuma movimentação quitada neste período.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  );
}
