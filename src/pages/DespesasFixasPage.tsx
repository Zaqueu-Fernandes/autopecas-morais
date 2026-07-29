/**
 * ============================================================================
 * PÁGINA — DESPESAS RECORRENTES
 * ============================================================================
 * Cadastra as despesas recorrentes (aluguel, internet, DAS...) e gera as
 * contas do mês (lançamentos em Financeiro) com um clique. Despesa recorrente
 * é GLOBAL, sem empresa própria (ver despesas/types.ts) — a conta gerada
 * nasce "Empresa a Definir" e só recebe a empresa real no momento de Quitar
 * (Financeiro), porque quem paga de fato pode variar mês a mês.
 */

import { useEffect, useState } from 'react';
import { ReceiptText, RefreshCw, Pencil, Ban, RotateCcw, Trash2 } from 'lucide-react';
import {
  type DespesaFixa,
  type ResultadoGeracao,
  FormDespesaFixa,
  listarDespesasFixas,
  salvarDespesaFixa,
  definirAtivoDespesaFixa,
  excluirDespesaFixa,
  ehViolacaoDeReferencia,
  gerarContasDoMes,
  ROTULO_PERIODICIDADE,
  DIAS_SEMANA,
  MESES_ANO,
} from '@/features/despesas';
import { type Categoria, listarCategorias } from '@/features/categorias';
import { type DocumentoListaImpressao, BotoesImpressaoLista } from '@/features/impressao';
import { useConfirmacao } from '@/shared/hooks/useConfirmacao';
import { formatarMoeda } from '@/shared/utils/formatadores';

function descricaoVencimento(d: DespesaFixa): string {
  if (d.periodicidade === 'semanal') return DIAS_SEMANA[Number(d.diaVencimento)] ?? '—';
  if (d.periodicidade === 'anual') {
    const mes = MESES_ANO[Number(d.mesVencimento) - 1] ?? '—';
    return `Dia ${d.diaVencimento} de ${mes}`;
  }
  return `Dia ${d.diaVencimento}`;
}

export function DespesasFixasPage() {
  const { confirmar, avisar } = useConfirmacao();
  const [despesas, setDespesas] = useState<DespesaFixa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [mostrarInativas, setMostrarInativas] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [despesaEmEdicao, setDespesaEmEdicao] = useState<DespesaFixa | null>(null);

  const [gerando, setGerando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoGeracao | null>(null);

  useEffect(() => {
    // inclui inativas: uma despesa antiga pode referenciar uma categoria já desativada
    listarCategorias({ somenteAtivas: false }).then(setCategorias);
  }, []);

  function nomeCategoria(chave: string): string {
    return categorias.find((c) => c.chave === chave)?.nome ?? chave;
  }

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setDespesas(await listarDespesasFixas({ somenteAtivas: !mostrarInativas }));
    } catch {
      setErro('Não foi possível carregar as despesas recorrentes.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarInativas]);

  async function handleSalvar(d: DespesaFixa) {
    await salvarDespesaFixa(d);
    setMostrarForm(false);
    setDespesaEmEdicao(null);
    await carregar();
  }

  async function handleDesativar(d: DespesaFixa) {
    const ok = await confirmar({
      titulo: 'Desativar esta despesa recorrente?',
      tom: 'aviso',
      mensagem: [
        `"${d.descricao}" deixa de gerar contas novas em "Gerar contas do mês".`,
        'As contas que ela já gerou no Financeiro continuam lá, intactas. É reversível: dá pra reativar a qualquer momento (ative "Mostrar inativas").',
      ],
      textoConfirmar: 'Desativar',
    });
    if (!ok) return;
    await definirAtivoDespesaFixa(d.id!, false);
    await carregar();
  }

  async function handleReativar(id: string) {
    await definirAtivoDespesaFixa(id, true);
    await carregar();
  }

  async function handleExcluir(d: DespesaFixa) {
    const ok = await confirmar({
      titulo: 'Excluir esta despesa recorrente?',
      tom: 'perigo',
      mensagem: [
        `"${d.descricao}" vai ser apagada definitivamente.`,
        'Só funciona se ela nunca tiver gerado nenhuma conta em Financeiro — se já gerou, o banco recusa pra não perder o histórico, e a alternativa é "Desativar".',
      ],
      textoConfirmar: 'Sim, excluir definitivamente',
    });
    if (!ok) return;
    try {
      await excluirDespesaFixa(d.id!);
      await carregar();
    } catch (erro) {
      if (ehViolacaoDeReferencia(erro)) {
        await avisar({
          titulo: 'Não é possível excluir',
          mensagem: `"${d.descricao}" já gerou contas em Financeiro, então não pode ser excluída (perderia o histórico dessas contas). Use "Desativar" pra ela parar de gerar contas novas sem apagar nada.`,
        });
        return;
      }
      throw erro;
    }
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

  const documentoImpressao: DocumentoListaImpressao = {
    titulo: 'Despesas Recorrentes',
    colunas: ['Descrição', 'Categoria', 'Valor', 'Periodicidade', 'Vencimento'],
    linhas: despesas.map((d) => [
      d.descricao,
      nomeCategoria(d.categoria),
      `${formatarMoeda(Number(d.valor))}${d.tipoValor === 'variavel' ? ' (média)' : ''}`,
      ROTULO_PERIODICIDADE[d.periodicidade],
      descricaoVencimento(d),
    ]),
  };

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Despesas Recorrentes</h1>
        <div className="pg-head-acoes">
          <BotoesImpressaoLista documento={documentoImpressao} className="dsp-btn-sec" />
          <button
            type="button"
            className="dsp-btn"
            onClick={() => {
              setDespesaEmEdicao(null);
              setMostrarForm(true);
            }}
          >
            <ReceiptText size={16} /> Nova despesa recorrente
          </button>
        </div>
      </div>

      <div className="pg-filtros">
        <button type="button" className="dsp-btn-sec" onClick={handleGerar} disabled={gerando}>
          <RefreshCw size={14} className={gerando ? 'dsp-icone-girando' : ''} />
          {gerando ? 'Gerando…' : `Gerar contas de ${mesReferencia}`}
        </button>
        <label className="dsp-filtro-inativas">
          <input
            type="checkbox"
            checked={mostrarInativas}
            onChange={(e) => setMostrarInativas(e.target.checked)}
          />
          Mostrar inativas
        </label>
      </div>

      {resultado && (
        <p className="dsp-resultado">
          {resultado.criadas} conta(s) gerada(s)
          {resultado.jaExistiam > 0 && `, ${resultado.jaExistiam} já existia(m) este mês`}.
          {resultado.criadas > 0 && ' Elas aparecem em Financeiro como "Empresa a Definir" até você Quitar cada uma.'}
        </p>
      )}

      {carregando && <p aria-live="polite">Carregando…</p>}
      {erro && <p className="dsp-erro" aria-live="polite">{erro}</p>}

      {!carregando && !erro && (
        <div className="pg-tabela-wrap">
        <table className="pg-tabela">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Valor</th>
              <th>Periodicidade</th>
              <th>Vencimento</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {despesas.map((d) => (
              <tr key={d.id} className={!d.ativo ? 'dsp-linha-inativa' : ''}>
                <td className="pg-tabela-truncar">
                  {d.descricao}
                  {!d.ativo && <span className="dsp-tag-inativa">Inativa</span>}
                </td>
                <td>{nomeCategoria(d.categoria)}</td>
                <td>
                  {formatarMoeda(Number(d.valor))}
                  {d.tipoValor === 'variavel' && <span className="dsp-tag-media">média</span>}
                </td>
                <td>{ROTULO_PERIODICIDADE[d.periodicidade]}</td>
                <td>{descricaoVencimento(d)}</td>
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
                  {d.ativo ? (
                    <button type="button" onClick={() => handleDesativar(d)}>
                      <Ban size={13} /> Desativar
                    </button>
                  ) : (
                    <button type="button" onClick={() => handleReativar(d.id!)}>
                      <RotateCcw size={13} /> Reativar
                    </button>
                  )}
                  <button type="button" onClick={() => handleExcluir(d)}>
                    <Trash2 size={13} /> Excluir
                  </button>
                </td>
              </tr>
            ))}
            {despesas.length === 0 && (
              <tr>
                <td colSpan={6}>Nenhuma despesa recorrente cadastrada.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
