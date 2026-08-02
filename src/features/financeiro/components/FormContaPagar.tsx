/**
 * ============================================================================
 * FORMULÁRIO — NOVA CONTA A PAGAR (lançamento manual)
 * ============================================================================
 * Cobre fornecedor/despesa/imposto/folha/retirada de lucro avulsos. Contas
 * fixas recorrentes (despesas_fixas) são de uma feature futura.
 */

import { useEffect, useState } from 'react';
import {
  type DadosContaPagar,
  dadosContaPagarVazio,
  validarContaPagar,
  semErros,
  type ErrosValidacao,
} from '../types';
import { type Fornecedor, type Credor, listarFornecedores, listarCredores } from '@/features/cadastros';
import { type Categoria, listarCategorias } from '@/features/categorias';

interface Props {
  /** `pagarAgora` diz se foi "Salvar e Pagar Agora" (true) ou "Salvar e Pagar Depois" (false). */
  onSalvar: (d: DadosContaPagar, pagarAgora: boolean) => Promise<void> | void;
  onCancelar?: () => void;
}

export function FormContaPagar({ onSalvar, onCancelar }: Props) {
  const [dados, setDados] = useState<DadosContaPagar>(dadosContaPagarVazio());
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<'agora' | 'depois' | null>(null);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [credores, setCredores] = useState<Credor[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    listarFornecedores().then(setFornecedores).catch(() => setFornecedores([]));
    listarCredores().then(setCredores).catch(() => setCredores([]));
    listarCategorias().then(setCategorias).catch(() => setCategorias([]));
  }, []);

  function set(patch: Partial<DadosContaPagar>) {
    setDados((d) => ({ ...d, ...patch }));
  }

  async function handleSalvar(pagarAgora: boolean) {
    const e = validarContaPagar(dados);
    setErros(e);
    if (!semErros(e)) return;
    setErroSalvar(null);
    setSalvando(pagarAgora ? 'agora' : 'depois');
    try {
      await onSalvar(dados, pagarAgora);
    } catch (erro) {
      setErroSalvar(erro instanceof Error ? erro.message : 'Não foi possível salvar esta conta.');
    } finally {
      setSalvando(null);
    }
  }

  return (
    <div className="fin-form">
      <div className="fin-form-head">
        <h2>Nova conta a pagar</h2>
      </div>

      <p className="fin-aviso">
        A empresa que paga é escolhida mais tarde, no momento de Quitar — não agora.
      </p>

      <div className="fin-grid">
        <div className="fin-campo">
          <label htmlFor="cp-categoria">Categoria *</label>
          <select
            id="cp-categoria"
            value={dados.categoria}
            onChange={(e) => set({ categoria: e.target.value })}
            aria-invalid={!!erros.categoria}
          >
            <option value="">— selecione —</option>
            {/* 'estorno' é gerada automaticamente por estornarLancamento — não é escolha manual */}
            {categorias
              .filter((c) => c.chave !== 'estorno')
              .map((c) => (
                <option key={c.chave} value={c.chave}>
                  {c.nome}
                </option>
              ))}
          </select>
          {erros.categoria && (
            <span className="fin-erro" aria-live="polite">
              {erros.categoria}
            </span>
          )}
        </div>

        {dados.categoria === 'fornecedor' && (
          <div className="fin-campo">
            <label htmlFor="cp-fornecedor">Fornecedor *</label>
            <select
              id="cp-fornecedor"
              value={dados.fornecedorId}
              onChange={(e) => set({ fornecedorId: e.target.value })}
              aria-invalid={!!erros.fornecedorId}
            >
              <option value="">— selecione —</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
            {erros.fornecedorId && (
              <span className="fin-erro" aria-live="polite">
                {erros.fornecedorId}
              </span>
            )}
          </div>
        )}

        {dados.categoria && dados.categoria !== 'fornecedor' && (
          <div className="fin-campo">
            <label htmlFor="cp-credor">Credor</label>
            <select
              id="cp-credor"
              value={dados.credorId}
              onChange={(e) => set({ credorId: e.target.value })}
            >
              <option value="">— nenhum —</option>
              {credores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="fin-campo fin-col-2">
          <label htmlFor="cp-descricao">Descrição *</label>
          <input
            id="cp-descricao"
            value={dados.descricao}
            onChange={(e) => set({ descricao: e.target.value })}
            placeholder="Ex.: compra de peças, conta de luz…"
            aria-invalid={!!erros.descricao}
            autoFocus
          />
          {erros.descricao && (
            <span className="fin-erro" aria-live="polite">
              {erros.descricao}
            </span>
          )}
        </div>

        <div className="fin-campo">
          <label htmlFor="cp-valor">Valor (R$) *</label>
          <input
            id="cp-valor"
            inputMode="decimal"
            value={dados.valor}
            onChange={(e) => set({ valor: e.target.value })}
            placeholder="0,00"
            aria-invalid={!!erros.valor}
          />
          {erros.valor && (
            <span className="fin-erro" aria-live="polite">
              {erros.valor}
            </span>
          )}
        </div>

        <div className="fin-campo">
          <label htmlFor="cp-vencimento">Vencimento *</label>
          <input
            id="cp-vencimento"
            type="date"
            value={dados.vencimento}
            onChange={(e) => set({ vencimento: e.target.value })}
            aria-invalid={!!erros.vencimento}
          />
          {erros.vencimento && (
            <span className="fin-erro" aria-live="polite">
              {erros.vencimento}
            </span>
          )}
        </div>
      </div>

      <div className="fin-campo">
        <label htmlFor="cp-observacoes">Observações</label>
        <textarea
          id="cp-observacoes"
          rows={2}
          value={dados.observacoes}
          onChange={(e) => set({ observacoes: e.target.value })}
        />
      </div>

      {erroSalvar && (
        <p className="fin-erro" aria-live="polite">
          {erroSalvar}
        </p>
      )}

      <div className="fin-acoes">
        {onCancelar && (
          <button type="button" className="fin-btn-sec" onClick={onCancelar} disabled={!!salvando}>
            Cancelar
          </button>
        )}
        <button
          type="button"
          className="fin-btn-sec"
          onClick={() => handleSalvar(false)}
          disabled={!!salvando}
        >
          {salvando === 'depois' ? 'Salvando…' : 'Salvar e Pagar Depois'}
        </button>
        <button type="button" className="fin-btn" onClick={() => handleSalvar(true)} disabled={!!salvando}>
          {salvando === 'agora' ? 'Salvando…' : 'Salvar e Pagar Agora'}
        </button>
      </div>
    </div>
  );
}
