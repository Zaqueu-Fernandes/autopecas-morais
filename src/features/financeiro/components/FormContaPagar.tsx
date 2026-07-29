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
import { type Fornecedor, listarFornecedores } from '@/features/cadastros';
import { type Empresa, listarEmpresas } from '@/features/empresa';
import { type Categoria, listarCategorias } from '@/features/categorias';

interface Props {
  onSalvar: (d: DadosContaPagar) => Promise<void> | void;
  onCancelar?: () => void;
}

export function FormContaPagar({ onSalvar, onCancelar }: Props) {
  const [dados, setDados] = useState<DadosContaPagar>(dadosContaPagarVazio());
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    listarFornecedores().then(setFornecedores).catch(() => setFornecedores([]));
    listarCategorias().then(setCategorias).catch(() => setCategorias([]));
    listarEmpresas().then((lista) => {
      setEmpresas(lista);
      if (lista.length === 1) set({ empresaId: lista[0].id });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set(patch: Partial<DadosContaPagar>) {
    setDados((d) => ({ ...d, ...patch }));
  }

  async function handleSalvar() {
    const e = validarContaPagar(dados);
    setErros(e);
    if (!semErros(e)) return;
    setErroSalvar(null);
    setSalvando(true);
    try {
      await onSalvar(dados);
    } catch (erro) {
      setErroSalvar(erro instanceof Error ? erro.message : 'Não foi possível salvar esta conta.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fin-form">
      <div className="fin-form-head">
        <h2>Nova conta a pagar</h2>
      </div>

      <div className="fin-grid">
        <div className="fin-campo">
          <label htmlFor="cp-empresa">Empresa (CNPJ) *</label>
          <select
            id="cp-empresa"
            value={dados.empresaId}
            onChange={(e) => set({ empresaId: e.target.value })}
            aria-invalid={!!erros.empresaId}
          >
            <option value="">— selecione —</option>
            {empresas.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nomeFantasia}
              </option>
            ))}
          </select>
          {erros.empresaId && (
            <span className="fin-erro" aria-live="polite">
              {erros.empresaId}
            </span>
          )}
        </div>

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
          <button type="button" className="fin-btn-sec" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="button" className="fin-btn" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar conta'}
        </button>
      </div>
    </div>
  );
}
