/**
 * ============================================================================
 * PÁGINA — DESPESAS FIXAS
 * ============================================================================
 * Cadastra as despesas recorrentes (aluguel, internet, DAS...) e gera as
 * contas do mês (lançamentos em Financeiro) com um clique.
 */

import { useEffect, useState } from 'react';
import { ReceiptText, RefreshCw, Pencil, Ban } from 'lucide-react';
import {
  type DespesaFixa,
  type ResultadoGeracao,
  FormDespesaFixa,
  listarDespesasFixas,
  salvarDespesaFixa,
  definirAtivoDespesaFixa,
  gerarContasDoMes,
  ROTULO_CATEGORIA_DESPESA,
} from '@/features/despesas';

export function DespesasFixasPage() {
  const [despesas, setDespesas] = useState<DespesaFixa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [despesaEmEdicao, setDespesaEmEdicao] = useState<DespesaFixa | null>(null);

  const [gerando, setGerando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoGeracao | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setDespesas(await listarDespesasFixas());
    } catch {
      setErro('Não foi possível carregar as despesas fixas.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSalvar(d: DespesaFixa) {
    await salvarDespesaFixa(d);
    setMostrarForm(false);
    setDespesaEmEdicao(null);
    await carregar();
  }

  async function handleDesativar(id: string) {
    if (!window.confirm('Desativar esta despesa fixa? Ela deixa de gerar contas novas.')) return;
    await definirAtivoDespesaFixa(id, false);
    await carregar();
  }

  async function handleGerar() {
    setGerando(true);
    setResultado(null);
    try {
      setResultado(await gerarContasDoMes());
    } finally {
      setGerando(false);
    }
  }

  if (mostrarForm) {
    return (
      <FormDespesaFixa
        inicial={despesaEmEdicao ?? undefined}
        onSalvar={handleSalvar}
        onCancelar={() => {
          setMostrarForm(false);
          setDespesaEmEdicao(null);
        }}
      />
    );
  }

  const mesReferencia = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Despesas Fixas</h1>
        <button
          type="button"
          className="dsp-btn"
          onClick={() => {
            setDespesaEmEdicao(null);
            setMostrarForm(true);
          }}
        >
          <ReceiptText size={16} /> Nova despesa fixa
        </button>
      </div>

      <div className="pg-filtros">
        <button type="button" className="dsp-btn-sec" onClick={handleGerar} disabled={gerando}>
          <RefreshCw size={14} className={gerando ? 'dsp-icone-girando' : ''} />
          {gerando ? 'Gerando…' : `Gerar contas de ${mesReferencia}`}
        </button>
      </div>

      {resultado && (
        <p className="dsp-resultado">
          {resultado.criadas} conta(s) gerada(s)
          {resultado.jaExistiam > 0 && `, ${resultado.jaExistiam} já existia(m) este mês`}.
        </p>
      )}

      {carregando && <p>Carregando…</p>}
      {erro && <p className="dsp-erro">{erro}</p>}

      {!carregando && !erro && (
        <table className="pg-tabela">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Valor</th>
              <th>Dia vcto.</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {despesas.map((d) => (
              <tr key={d.id}>
                <td>{d.descricao}</td>
                <td>{ROTULO_CATEGORIA_DESPESA[d.categoria]}</td>
                <td>R$ {Number(d.valor).toFixed(2)}</td>
                <td>{d.diaVencimento}</td>
                <td className="pg-acoes-linha">
                  <button
                    type="button"
                    onClick={() => {
                      setDespesaEmEdicao(d);
                      setMostrarForm(true);
                    }}
                  >
                    <Pencil size={13} /> Editar
                  </button>
                  <button type="button" onClick={() => handleDesativar(d.id!)}>
                    <Ban size={13} /> Desativar
                  </button>
                </td>
              </tr>
            ))}
            {despesas.length === 0 && (
              <tr>
                <td colSpan={5}>Nenhuma despesa fixa cadastrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
