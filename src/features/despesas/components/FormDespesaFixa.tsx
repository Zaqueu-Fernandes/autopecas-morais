/**
 * ============================================================================
 * FORMULÁRIO DE DESPESA RECORRENTE
 * ============================================================================
 * Cadastra/edita a definição recorrente. "Gerar contas do mês" (na página)
 * é quem realmente lança em financeiro — este formulário só guarda a regra.
 */

import { useEffect, useState } from 'react';
import {
  type DespesaFixa,
  type TipoValorDespesa,
  type Periodicidade,
  despesaFixaVazia,
  validarDespesaFixa,
  semErros,
  ROTULO_TIPO_VALOR,
  ROTULO_PERIODICIDADE,
  DIAS_SEMANA,
  MESES_ANO,
  type ErrosValidacao,
} from '../types';
import { type Fornecedor, type Credor, listarFornecedores, listarCredores } from '@/features/cadastros';
import { type Categoria, listarCategorias } from '@/features/categorias';

interface Props {
  inicial?: DespesaFixa;
  onSalvar: (d: DespesaFixa) => Promise<void> | void;
  onCancelar?: () => void;
}

export function FormDespesaFixa({ inicial, onSalvar, onCancelar }: Props) {
  const [despesa, setDespesa] = useState<DespesaFixa>(inicial ?? despesaFixaVazia());
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [salvando, setSalvando] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [credores, setCredores] = useState<Credor[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    listarFornecedores().then(setFornecedores).catch(() => setFornecedores([]));
    listarCredores().then(setCredores).catch(() => setCredores([]));
    listarCategorias().then(setCategorias).catch(() => setCategorias([]));
  }, []);

  function set(patch: Partial<DespesaFixa>) {
    setDespesa((d) => ({ ...d, ...patch }));
  }

  /** Foca o primeiro campo com erro, na ordem em que aparecem no formulário. */
  function focarPrimeiroErro(e: ErrosValidacao) {
    const ordem: Array<[string, string]> = [
      ['descricao', 'dsp-descricao'],
      ['categoria', 'dsp-categoria'],
      ['fornecedorId', 'dsp-fornecedor'],
      ['valor', 'dsp-valor'],
      ['diaVencimento', despesa.periodicidade === 'semanal' ? 'dsp-dia-semana' : 'dsp-dia-vencimento'],
      ['mesVencimento', 'dsp-mes'],
    ];
    const primeiro = ordem.find(([chave]) => e[chave]);
    if (primeiro) document.getElementById(primeiro[1])?.focus();
  }

  async function handleSalvar() {
    const e = validarDespesaFixa(despesa);
    setErros(e);
    if (!semErros(e)) {
      focarPrimeiroErro(e);
      return;
    }
    setSalvando(true);
    try {
      await onSalvar(despesa);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="dsp-form">
      <div className="dsp-form-head">
        <h2>{despesa.id ? 'Editar despesa recorrente' : 'Nova despesa recorrente'}</h2>
      </div>

      <div className="dsp-grid">
        <div className="dsp-campo dsp-col-2">
          <label htmlFor="dsp-descricao">Descrição *</label>
          <input
            id="dsp-descricao"
            name="descricao"
            autoComplete="off"
            value={despesa.descricao}
            onChange={(e) => set({ descricao: e.target.value })}
            placeholder="Ex.: aluguel, internet, DAS do MEI…"
            aria-invalid={!!erros.descricao}
            autoFocus
          />
          {erros.descricao && (
            <span className="dsp-erro" aria-live="polite">
              {erros.descricao}
            </span>
          )}
        </div>

        <div className="dsp-campo">
          <label htmlFor="dsp-categoria">Categoria *</label>
          <select
            id="dsp-categoria"
            value={despesa.categoria}
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
            <span className="dsp-erro" aria-live="polite">
              {erros.categoria}
            </span>
          )}
        </div>

        {despesa.categoria === 'fornecedor' && (
          <div className="dsp-campo">
            <label htmlFor="dsp-fornecedor">Fornecedor *</label>
            <select
              id="dsp-fornecedor"
              value={despesa.fornecedorId}
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
              <span className="dsp-erro" aria-live="polite">
                {erros.fornecedorId}
              </span>
            )}
          </div>
        )}

        {despesa.categoria && despesa.categoria !== 'fornecedor' && (
          <div className="dsp-campo">
            <label htmlFor="dsp-credor">Credor</label>
            <select
              id="dsp-credor"
              value={despesa.credorId}
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

        <div className="dsp-campo dsp-col-2">
          <label>O valor é sempre o mesmo?</label>
          <div className="dsp-radios">
            {(Object.keys(ROTULO_TIPO_VALOR) as TipoValorDespesa[]).map((t) => (
              <label key={t}>
                <input
                  type="radio"
                  name="tipoValor"
                  checked={despesa.tipoValor === t}
                  onChange={() => set({ tipoValor: t })}
                />
                {ROTULO_TIPO_VALOR[t]}
              </label>
            ))}
          </div>
        </div>

        <div className="dsp-campo">
          <label htmlFor="dsp-valor">
            {despesa.tipoValor === 'variavel' ? 'Valor médio (R$) *' : 'Valor (R$) *'}
          </label>
          <input
            id="dsp-valor"
            name="valor"
            autoComplete="off"
            inputMode="decimal"
            value={despesa.valor}
            onChange={(e) => set({ valor: e.target.value })}
            placeholder="0,00"
            aria-invalid={!!erros.valor}
          />
          {erros.valor && (
            <span className="dsp-erro" aria-live="polite">
              {erros.valor}
            </span>
          )}
          {despesa.tipoValor === 'variavel' && (
            <span className="dsp-dica">
              Usado como estimativa ao gerar a conta do mês — ajuste pro valor real em Financeiro antes de quitar.
            </span>
          )}
        </div>

        <div className="dsp-campo dsp-col-2">
          <label>Com que frequência se repete?</label>
          <div className="dsp-radios">
            {(Object.keys(ROTULO_PERIODICIDADE) as Periodicidade[]).map((p) => (
              <label key={p}>
                <input
                  type="radio"
                  name="periodicidade"
                  checked={despesa.periodicidade === p}
                  onChange={() => set({ periodicidade: p, diaVencimento: '', mesVencimento: '' })}
                />
                {ROTULO_PERIODICIDADE[p]}
              </label>
            ))}
          </div>
        </div>

        {despesa.periodicidade === 'semanal' ? (
          <div className="dsp-campo">
            <label htmlFor="dsp-dia-semana">Dia da semana *</label>
            <select
              id="dsp-dia-semana"
              value={despesa.diaVencimento}
              onChange={(e) => set({ diaVencimento: e.target.value })}
              aria-invalid={!!erros.diaVencimento}
            >
              <option value="">— selecione —</option>
              {DIAS_SEMANA.map((nome, i) => (
                <option key={i} value={i}>
                  {nome}
                </option>
              ))}
            </select>
            {erros.diaVencimento && (
              <span className="dsp-erro" aria-live="polite">
                {erros.diaVencimento}
              </span>
            )}
          </div>
        ) : (
          <div className="dsp-campo">
            <label htmlFor="dsp-dia-vencimento">Dia do vencimento *</label>
            <input
              id="dsp-dia-vencimento"
              inputMode="numeric"
              value={despesa.diaVencimento}
              onChange={(e) => set({ diaVencimento: e.target.value })}
              placeholder="1 a 28"
              aria-invalid={!!erros.diaVencimento}
            />
            {erros.diaVencimento && (
              <span className="dsp-erro" aria-live="polite">
                {erros.diaVencimento}
              </span>
            )}
          </div>
        )}

        {despesa.periodicidade === 'anual' && (
          <div className="dsp-campo">
            <label htmlFor="dsp-mes">Mês *</label>
            <select
              id="dsp-mes"
              value={despesa.mesVencimento}
              onChange={(e) => set({ mesVencimento: e.target.value })}
              aria-invalid={!!erros.mesVencimento}
            >
              <option value="">— selecione —</option>
              {MESES_ANO.map((nome, i) => (
                <option key={i} value={i + 1}>
                  {nome}
                </option>
              ))}
            </select>
            {erros.mesVencimento && (
              <span className="dsp-erro" aria-live="polite">
                {erros.mesVencimento}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="dsp-campo">
        <label htmlFor="dsp-observacoes">Observações</label>
        <textarea
          id="dsp-observacoes"
          rows={2}
          value={despesa.observacoes}
          onChange={(e) => set({ observacoes: e.target.value })}
        />
      </div>

      <div className="dsp-acoes">
        {onCancelar && (
          <button type="button" className="dsp-btn-sec" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="button" className="dsp-btn" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar despesa'}
        </button>
      </div>
    </div>
  );
}
