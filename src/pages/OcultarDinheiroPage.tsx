/**
 * ============================================================================
 * PÁGINA — OCULTAR PAGAMENTOS EM DINHEIRO (admin-only)
 * ============================================================================
 * Sub-seção da aba Permissões (ver AdministracaoPage.tsx). Substitui o
 * antigo botão "Visibilidade" por lançamento (FormVisibilidadeLancamento,
 * removido) por um painel em lote: o admin filtra um mês/ano, escolhe pra
 * quais usuários a ação vale, e marca/desmarca lançamentos numa tabela
 * estilo caixa de e-mail (selecionar todos + desmarcar alguns manualmente).
 *
 * O checkbox de cada linha reflete o ESTADO ATUAL: só vem marcado se o
 * lançamento já está oculto pra TODOS os usuários selecionados no
 * checklist. Ao clicar "Salvar", os marcados passam a ficar ocultos pra
 * todos os selecionados (soma quem faltava) e os desmarcados voltam a
 * ficar visíveis pra todos os selecionados (tira quem sobrava) — só dentro
 * do mês/ano filtrado, sem mexer em outros períodos nem em outros usuários.
 */

import { useEffect, useRef, useState } from 'react';
import { EyeOff } from 'lucide-react';
import {
  type LancamentoFinanceiro,
  listarLancamentosDinheiroRecebidos,
  buscarTodasOcultacoes,
  sincronizarOcultacoesEmLote,
  ROTULO_FORMA_PAGAMENTO,
} from '@/features/financeiro';
import { type Perfil, listarPerfis, useAuth } from '@/features/auth';
import { formatarMoeda } from '@/shared/utils/formatadores';

const NOMES_MES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function anosDisponiveis(): number[] {
  const atual = new Date().getFullYear();
  return [atual, atual - 1, atual - 2];
}

export function OcultarDinheiroPage() {
  const { sessao } = useAuth();
  const meuId = sessao?.user.id;
  const hoje = new Date();

  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [usuariosSelecionados, setUsuariosSelecionados] = useState<Set<string>>(new Set());
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [mapaOcultacoes, setMapaOcultacoes] = useState<Record<string, string[]>>({});
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const checkboxTodosRef = useRef<HTMLInputElement>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [listaPerfis, listaLancamentos, mapa] = await Promise.all([
        listarPerfis(),
        listarLancamentosDinheiroRecebidos(ano, mes),
        buscarTodasOcultacoes(),
      ]);
      setPerfis(listaPerfis);
      setLancamentos(listaLancamentos);
      setMapaOcultacoes(mapa);
    } catch {
      setErro('Não foi possível carregar os lançamentos em dinheiro deste período.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ano, mes]);

  // Recalcula quais linhas vêm marcadas sempre que o período recarrega ou o
  // checklist de usuários muda — reflete o estado real (oculto pra TODOS os
  // selecionados), pra não mentir sobre o que já está salvo.
  useEffect(() => {
    if (usuariosSelecionados.size === 0) {
      setSelecionados(new Set());
      return;
    }
    const idsUsuarios = Array.from(usuariosSelecionados);
    const novo = new Set<string>();
    for (const l of lancamentos) {
      const ocultamHoje = mapaOcultacoes[l.id!] ?? [];
      if (idsUsuarios.every((id) => ocultamHoje.includes(id))) novo.add(l.id!);
    }
    setSelecionados(novo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lancamentos, mapaOcultacoes, usuariosSelecionados]);

  const todasMarcadas = lancamentos.length > 0 && selecionados.size === lancamentos.length;
  const algumasMarcadas = selecionados.size > 0 && !todasMarcadas;

  useEffect(() => {
    if (checkboxTodosRef.current) checkboxTodosRef.current.indeterminate = algumasMarcadas;
  }, [algumasMarcadas]);

  function alternarUsuario(id: string, marcado: boolean) {
    setUsuariosSelecionados((atual) => {
      const novo = new Set(atual);
      if (marcado) novo.add(id);
      else novo.delete(id);
      return novo;
    });
  }

  function alternarLinha(id: string, marcado: boolean) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (marcado) novo.add(id);
      else novo.delete(id);
      return novo;
    });
  }

  function alternarTodas() {
    setSelecionados(todasMarcadas ? new Set() : new Set(lancamentos.map((l) => l.id!)));
  }

  /** Quando mais de 1 usuário está selecionado, avisa quando o lançamento está oculto só pra ALGUNS deles (não reflete no checkbox). */
  function statusParcial(l: LancamentoFinanceiro): string | null {
    if (usuariosSelecionados.size < 2) return null;
    const ocultamHoje = mapaOcultacoes[l.id!] ?? [];
    const qtd = Array.from(usuariosSelecionados).filter((id) => ocultamHoje.includes(id)).length;
    if (qtd === 0 || qtd === usuariosSelecionados.size) return null;
    return `Oculto p/ ${qtd} de ${usuariosSelecionados.size} selecionados`;
  }

  async function handleSalvar() {
    if (usuariosSelecionados.size === 0) {
      setErro('Selecione ao menos um usuário antes de salvar.');
      return;
    }
    setSalvando(true);
    setErro(null);
    setMensagem(null);
    try {
      const ocultar = lancamentos.filter((l) => selecionados.has(l.id!)).map((l) => l.id!);
      const mostrar = lancamentos.filter((l) => !selecionados.has(l.id!)).map((l) => l.id!);
      await sincronizarOcultacoesEmLote(Array.from(usuariosSelecionados), ocultar, mostrar);
      setMensagem('Visibilidade atualizada com sucesso.');
      await carregar();
    } catch {
      setErro('Não foi possível salvar as alterações — tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Ocultar Pagamentos em Dinheiro</h1>
      </div>

      <p className="perm-intro">
        Escolha o período, marque pra quais usuários a regra vale, e selecione os lançamentos
        recebidos em dinheiro que devem sumir de listas, somatórios (Dashboard, Fluxo de Caixa) e
        relatórios impressos/PDF pra eles — como se não existissem. É reversível a qualquer momento,
        voltando aqui e desmarcando.
      </p>

      <div className="pg-filtros">
        <select value={ano} onChange={(e) => setAno(Number(e.target.value))} aria-label="Filtrar por ano">
          {anosDisponiveis().map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select value={mes} onChange={(e) => setMes(Number(e.target.value))} aria-label="Filtrar por mês">
          {NOMES_MES.map((nome, i) => (
            <option key={nome} value={i + 1}>{nome}</option>
          ))}
        </select>
      </div>

      <p className="fin-aviso">Usuários afetados por esta ação:</p>
      <div className="fin-checklist">
        {perfis.map((p) => (
          <label key={p.id} className="fin-checklist-item">
            <input
              type="checkbox"
              checked={usuariosSelecionados.has(p.id)}
              onChange={(e) => alternarUsuario(p.id, e.target.checked)}
            />
            <span>
              {p.nome}
              {p.id === meuId && ' (você)'}
            </span>
            <span className="fin-checklist-papel">{p.papel === 'admin' ? 'Admin' : 'Operador'}</span>
          </label>
        ))}
        {perfis.length === 0 && <p>Nenhum usuário cadastrado.</p>}
      </div>

      {carregando && <p aria-live="polite">Carregando…</p>}
      {erro && <p className="fin-erro" aria-live="polite">{erro}</p>}
      {mensagem && <p className="fin-sucesso" aria-live="polite">{mensagem}</p>}

      {!carregando && (
        <div className="pg-tabela-wrap">
          <table className="pg-tabela">
            <thead>
              <tr>
                <th className="fin-celula-check">
                  <input
                    ref={checkboxTodosRef}
                    type="checkbox"
                    checked={todasMarcadas}
                    onChange={alternarTodas}
                    disabled={lancamentos.length === 0 || usuariosSelecionados.size === 0}
                    aria-label="Selecionar todos os lançamentos"
                  />
                </th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Data</th>
                <th>Forma de Pagamento</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.map((l) => {
                const parcial = statusParcial(l);
                return (
                  <tr key={l.id}>
                    <td className="fin-celula-check">
                      <input
                        type="checkbox"
                        checked={selecionados.has(l.id!)}
                        onChange={(e) => alternarLinha(l.id!, e.target.checked)}
                        disabled={usuariosSelecionados.size === 0}
                        aria-label={`Selecionar ${l.descricao}`}
                      />
                    </td>
                    <td className="pg-tabela-truncar">{l.descricao}</td>
                    <td>{formatarMoeda(l.valor)}</td>
                    <td>{l.dataPagamento ? new Date(l.dataPagamento).toLocaleDateString('pt-BR') : '—'}</td>
                    <td>{l.formaPagamento ? ROTULO_FORMA_PAGAMENTO[l.formaPagamento] : '—'}</td>
                    <td>
                      {parcial && <span className="fin-badge-parcial">{parcial}</span>}
                    </td>
                  </tr>
                );
              })}
              {lancamentos.length === 0 && (
                <tr>
                  <td colSpan={6}>Nenhum lançamento em dinheiro recebido nesse período.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="fin-acoes">
        <button type="button" className="fin-btn" onClick={handleSalvar} disabled={salvando || carregando}>
          <EyeOff size={16} /> {salvando ? 'Salvando…' : 'Salvar visibilidade'}
        </button>
      </div>
    </div>
  );
}
