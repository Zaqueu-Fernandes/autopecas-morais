/**
 * ============================================================================
 * PÁGINA — EXTRATO (Financeiro, só consulta)
 * ============================================================================
 * Sub-aba de Financeiro (ver FinanceiroPage.tsx). Lista despesas e receitas
 * juntas, com filtro por tipo/status/empresa — só CONSULTA, sem nenhum botão
 * de ação (lançar/quitar/editar valor/excluir/estornar). Essas ações moraram
 * aqui até esta reforma; agora vivem em Contas a Pagar / Contas a Receber,
 * pra não misturar "olhar o extrato" com "mexer num lançamento" (pedido
 * explícito do usuário).
 */

import { useEffect, useState } from 'react';
import {
  type LancamentoFinanceiro,
  type TipoFinanceiro,
  type FormaPagamento,
  type Periodicidade,
  listarFinanceiro,
  buscarIdsOcultosParaUsuario,
  buscarTodasOcultacoes,
  ROTULO_CATEGORIA_RECEBER,
  ROTULO_FORMA_PAGAMENTO,
} from '@/features/financeiro';
import { type Empresa, listarEmpresas } from '@/features/empresa';
import { type Categoria, listarCategorias } from '@/features/categorias';
import { type ContaFinanceira, listarContasFinanceiras, ROTULO_TIPO_CONTA } from '@/features/contas-financeiras';
import { type DocumentoListaImpressao, BotoesImpressaoLista } from '@/features/impressao';
import { useAuth } from '@/features/auth';
import { formatarMoeda } from '@/shared/utils/formatadores';

/** Espelha ROTULO_PERIODICIDADE de despesas/types.ts — só pra exibir a tag aqui. */
const ROTULO_PERIODICIDADE: Record<Periodicidade, string> = {
  semanal: 'Semanal',
  mensal: 'Mensal',
  anual: 'Anual',
};

type FiltroTipo = TipoFinanceiro | 'todos';
type FiltroStatus = 'pendentes' | 'quitados' | 'todos';

const FORMAS = Object.keys(ROTULO_FORMA_PAGAMENTO) as FormaPagamento[];

function rotuloCategoria(l: LancamentoFinanceiro, categorias: Categoria[]): string {
  if (l.tipo === 'receber')
    return ROTULO_CATEGORIA_RECEBER[l.categoria as keyof typeof ROTULO_CATEGORIA_RECEBER];
  return categorias.find((c) => c.chave === l.categoria)?.nome ?? l.categoria;
}

/**
 * Vencimento nulo tem 2 causas bem diferentes (ver "3 situações de
 * recebimento" em Faturamento, CLAUDE.md): à vista, que já foi pago na hora
 * e nunca teve vencimento — não tem o que rotular; ou fiado ("Em aberto"),
 * pendente sem data marcada. Só o segundo caso ganha o rótulo "Em Aberto";
 * o primeiro continua "—". Mesmo helper de ContasReceberPage.tsx.
 */
function rotuloVencimento(l: LancamentoFinanceiro): string {
  if (l.vencimento) return new Date(l.vencimento).toLocaleDateString('pt-BR');
  if (!l.pago && !l.estornado) return 'Em Aberto';
  return '—';
}

export function ExtratoFinanceiroPage() {
  const { sessao, ehAdmin } = useAuth();
  const meuId = sessao?.user.id;
  const [lancamentosCompletos, setLancamentosCompletos] = useState<LancamentoFinanceiro[]>([]);
  const [idsOcultosParaMim, setIdsOcultosParaMim] = useState<Set<string>>(new Set());
  const [mapaOcultacoes, setMapaOcultacoes] = useState<Record<string, string[]>>({});
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [contas, setContas] = useState<ContaFinanceira[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('pendentes');
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('');
  const [filtroFormaPagamento, setFiltroFormaPagamento] = useState<FormaPagamento | ''>('');
  const [mostrarOcultos, setMostrarOcultos] = useState(false);

  function nomeEmpresa(id: string | null): string {
    return empresas.find((e) => e.id === id)?.nomeFantasia ?? '—';
  }

  function nomeConta(id: string | null): string {
    const c = contas.find((c) => c.id === id);
    return c ? `${c.instituicao} (${ROTULO_TIPO_CONTA[c.tipo]})` : '—';
  }

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [lista, listaEmpresas, listaCategorias, listaContas, idsOcultos, mapaOcultacoesCarregado] =
        await Promise.all([
          listarFinanceiro({
            tipo: filtroTipo === 'todos' ? undefined : filtroTipo,
            pago: filtroStatus === 'todos' ? undefined : filtroStatus === 'quitados',
            empresaId: filtroEmpresa || undefined,
            formaPagamento: filtroFormaPagamento || undefined,
          }),
          listarEmpresas(),
          listarCategorias({ somenteAtivas: false }),
          listarContasFinanceiras({ somenteAtivas: false }),
          meuId ? buscarIdsOcultosParaUsuario(meuId) : Promise.resolve(new Set<string>()),
          ehAdmin ? buscarTodasOcultacoes() : Promise.resolve({}),
        ]);
      setLancamentosCompletos(lista);
      setEmpresas(listaEmpresas);
      setCategorias(listaCategorias);
      setContas(listaContas);
      setIdsOcultosParaMim(idsOcultos);
      setMapaOcultacoes(mapaOcultacoesCarregado);
    } catch {
      setErro('Não foi possível carregar o extrato.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroTipo, filtroStatus, filtroEmpresa, filtroFormaPagamento]);

  // O que EU vejo: todo lançamento, menos os que estão ocultos pra mim
  // especificamente (ver financeiro_ocultacoes). É essa lista — nunca a
  // completa — que alimenta o relatório impresso/PDF, mesmo quando admin
  // está com "Mostrar ocultos" ligado pra gerenciar a tabela na tela.
  const lancamentosVisiveisParaMim = lancamentosCompletos.filter((l) => !idsOcultosParaMim.has(l.id!));
  const lancamentos = ehAdmin && mostrarOcultos ? lancamentosCompletos : lancamentosVisiveisParaMim;

  const documentoImpressao: DocumentoListaImpressao = {
    titulo: 'Extrato',
    subtitulo: filtroEmpresa ? empresas.find((e) => e.id === filtroEmpresa)?.nomeFantasia : 'Todas as empresas',
    colunas: [
      'Empresa',
      'Conta',
      'Tipo',
      'Categoria',
      'Descrição',
      'Valor',
      'Forma de Pagamento',
      'Data Pagamento',
      'Vencimento',
      'Status',
    ],
    linhas: lancamentosVisiveisParaMim.map((l) => [
      l.empresaId === null ? 'Empresa a Definir' : nomeEmpresa(l.empresaId),
      nomeConta(l.contaFinanceiraId),
      l.tipo === 'pagar' ? 'Despesa' : 'Receita',
      rotuloCategoria(l, categorias),
      l.descricao,
      formatarMoeda(l.valor),
      l.pago && l.formaPagamento ? ROTULO_FORMA_PAGAMENTO[l.formaPagamento] : '—',
      l.pago && l.dataPagamento ? new Date(l.dataPagamento).toLocaleDateString('pt-BR') : '—',
      rotuloVencimento(l),
      l.estornado ? 'Estornado' : l.pago ? 'Quitado' : 'Pendente',
    ]),
  };

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Extrato</h1>
        <div className="pg-head-acoes">
          <BotoesImpressaoLista documento={documentoImpressao} className="fin-btn-sec" />
        </div>
      </div>

      <div className="pg-filtros">
        <select
          value={filtroEmpresa}
          onChange={(e) => setFiltroEmpresa(e.target.value)}
          aria-label="Filtrar por empresa"
        >
          <option value="">Todas as empresas</option>
          {empresas.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.nomeFantasia}
            </option>
          ))}
        </select>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as FiltroTipo)}
          aria-label="Filtrar por tipo"
        >
          <option value="todos">Despesas e receitas</option>
          <option value="pagar">Só despesas</option>
          <option value="receber">Só receitas</option>
        </select>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as FiltroStatus)}
          aria-label="Filtrar por status"
        >
          <option value="pendentes">Pendentes</option>
          <option value="quitados">Quitados</option>
          <option value="todos">Todos</option>
        </select>
        <select
          value={filtroFormaPagamento}
          onChange={(e) => setFiltroFormaPagamento(e.target.value as FormaPagamento | '')}
          aria-label="Filtrar por forma de pagamento"
        >
          <option value="">Todas as formas de pagamento</option>
          {FORMAS.map((f) => (
            <option key={f} value={f}>
              {ROTULO_FORMA_PAGAMENTO[f]}
            </option>
          ))}
        </select>
        {ehAdmin && (
          <label className="fin-filtro-ocultos">
            <input type="checkbox" checked={mostrarOcultos} onChange={(e) => setMostrarOcultos(e.target.checked)} />
            Mostrar ocultos
          </label>
        )}
      </div>

      {carregando && <p aria-live="polite">Carregando…</p>}
      {erro && <p className="fin-erro" aria-live="polite">{erro}</p>}

      {!carregando && !erro && (
        <div className="pg-tabela-wrap">
        <table className="pg-tabela">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Conta</th>
              <th>Tipo</th>
              <th>Categoria</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Forma de Pagamento</th>
              <th>Data Pagamento</th>
              <th>Vencimento</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {lancamentos.map((l) => {
              const usuariosQueOcultam = mapaOcultacoes[l.id!] ?? [];
              return (
                <tr key={l.id} className={idsOcultosParaMim.has(l.id!) ? 'fin-linha-oculta' : undefined}>
                  <td>
                    {l.empresaId === null ? (
                      <span className="fin-badge-empresa-definir">Empresa a Definir</span>
                    ) : (
                      nomeEmpresa(l.empresaId)
                    )}
                  </td>
                  <td>{nomeConta(l.contaFinanceiraId)}</td>
                  <td>
                    <span className={`fin-badge-tipo fin-badge-${l.tipo}`}>
                      {l.tipo === 'pagar' ? 'Despesa' : 'Receita'}
                    </span>
                  </td>
                  <td>
                    {rotuloCategoria(l, categorias)}
                    {l.periodicidade && <span className="fin-tag">{ROTULO_PERIODICIDADE[l.periodicidade]}</span>}
                  </td>
                  <td className="pg-tabela-truncar">{l.descricao}</td>
                  <td>{formatarMoeda(l.valor)}</td>
                  <td>{l.pago && l.formaPagamento ? ROTULO_FORMA_PAGAMENTO[l.formaPagamento] : '—'}</td>
                  <td>{l.pago && l.dataPagamento ? new Date(l.dataPagamento).toLocaleDateString('pt-BR') : '—'}</td>
                  <td>{rotuloVencimento(l)}</td>
                  <td>
                    <span
                      className={`fin-badge-status ${
                        l.estornado ? 'fin-badge-estornado' : l.pago ? 'fin-badge-pago' : 'fin-badge-pendente'
                      }`}
                    >
                      {l.estornado ? 'Estornado' : l.pago ? 'Quitado' : 'Pendente'}
                    </span>
                    {ehAdmin && usuariosQueOcultam.length > 0 && (
                      <span className="fin-badge-oculto">
                        Oculto p/ {usuariosQueOcultam.length} usuário{usuariosQueOcultam.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {lancamentos.length === 0 && (
              <tr>
                <td colSpan={10}>Nenhum lançamento encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
