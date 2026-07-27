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
  type CategoriaPagar,
  type CategoriaReceber,
  buscarFluxoCaixa,
  ROTULO_CATEGORIA_PAGAR,
  ROTULO_CATEGORIA_RECEBER,
} from '@/features/financeiro';
import { CartaoResumo } from '@/features/dashboard';

function primeiroDiaDoMes(): string {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
}

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function rotuloCategoria(tipo: 'pagar' | 'receber', categoria: string): string {
  return tipo === 'pagar'
    ? ROTULO_CATEGORIA_PAGAR[categoria as CategoriaPagar]
    : ROTULO_CATEGORIA_RECEBER[categoria as CategoriaReceber];
}

export function FluxoCaixaPage() {
  const [inicio, setInicio] = useState(primeiroDiaDoMes());
  const [fim, setFim] = useState(hojeISO());
  const [resultado, setResultado] = useState<ResultadoFluxoCaixa | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setResultado(await buscarFluxoCaixa(inicio, fim));
    } catch {
      setErro('Não foi possível carregar o fluxo de caixa.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicio, fim]);

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Fluxo de Caixa</h1>
      </div>

      <div className="pg-filtros">
        <label className="fin-campo-inline">
          De
          <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </label>
        <label className="fin-campo-inline">
          Até
          <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
        </label>
      </div>

      {carregando && <p>Carregando…</p>}
      {erro && <p className="fin-erro">{erro}</p>}

      {!carregando && !erro && resultado && (
        <>
          <div className="dash-grid">
            <CartaoResumo
              titulo="Saldo anterior"
              valor={`R$ ${resultado.saldoAnterior.toFixed(2)}`}
              icone={<History size={15} />}
            />
            <CartaoResumo
              titulo="Entradas no período"
              valor={`R$ ${resultado.totalEntradas.toFixed(2)}`}
              icone={<ArrowDownCircle size={15} />}
            />
            <CartaoResumo
              titulo="Saídas no período"
              valor={`R$ ${resultado.totalSaidas.toFixed(2)}`}
              icone={<ArrowUpCircle size={15} />}
            />
            <CartaoResumo
              titulo="Saldo final"
              valor={`R$ ${resultado.saldoFinal.toFixed(2)}`}
              tom={resultado.saldoFinal < 0 ? 'perigo' : 'neutro'}
              icone={resultado.saldoFinal < 0 ? <TrendingDown size={15} /> : <TrendingUp size={15} />}
            />
          </div>

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
                  <td>{rotuloCategoria(m.tipo, m.categoria)}</td>
                  <td>{m.descricao}</td>
                  <td>
                    {m.tipo === 'pagar' ? '-' : '+'} R$ {m.valor.toFixed(2)}
                  </td>
                  <td>R$ {m.saldoAcumulado.toFixed(2)}</td>
                </tr>
              ))}
              {resultado.movimentos.length === 0 && (
                <tr>
                  <td colSpan={6}>Nenhuma movimentação quitada neste período.</td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
