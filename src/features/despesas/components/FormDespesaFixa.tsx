/**
 * ============================================================================
 * FORMULÁRIO DE DESPESA FIXA
 * ============================================================================
 * Cadastra/edita a definição recorrente. "Gerar contas do mês" (na página)
 * é quem realmente lança em financeiro — este formulário só guarda a regra.
 */

import { useEffect, useState } from 'react';
import {
  type DespesaFixa,
  type CategoriaDespesaFixa,
  type TipoValorDespesa,
  despesaFixaVazia,
  validarDespesaFixa,
  semErros,
  ROTULO_CATEGORIA_DESPESA,
  ROTULO_TIPO_VALOR,
  type ErrosValidacao,
} from '../types';
import { type Fornecedor, listarFornecedores } from '@/features/cadastros';
import { type Empresa, listarEmpresas } from '@/features/empresa';

interface Props {
  inicial?: DespesaFixa;
  empresaIdPadrao?: string;
  onSalvar: (d: DespesaFixa) => Promise<void> | void;
  onCancelar?: () => void;
}

const CATEGORIAS = Object.keys(ROTULO_CATEGORIA_DESPESA) as CategoriaDespesaFixa[];

export function FormDespesaFixa({ inicial, empresaIdPadrao, onSalvar, onCancelar }: Props) {
  const [despesa, setDespesa] = useState<DespesaFixa>(
    inicial ?? { ...despesaFixaVazia(), empresaId: empresaIdPadrao ?? '' },
  );
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [salvando, setSalvando] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  useEffect(() => {
    listarFornecedores().then(setFornecedores).catch(() => setFornecedores([]));
    listarEmpresas().then(setEmpresas).catch(() => setEmpresas([]));
  }, []);

  function set(patch: Partial<DespesaFixa>) {
    setDespesa((d) => ({ ...d, ...patch }));
  }

  async function handleSalvar() {
    const e = validarDespesaFixa(despesa);
    setErros(e);
    if (!semErros(e)) return;
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
        <h2>{despesa.id ? 'Editar despesa fixa' : 'Nova despesa fixa'}</h2>
      </div>

      <div className="dsp-grid">
        <div className="dsp-campo">
          <label>Empresa (CNPJ) *</label>
          <select
            value={despesa.empresaId}
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
          {erros.empresaId && <span className="dsp-erro">{erros.empresaId}</span>}
        </div>

        <div className="dsp-campo dsp-col-2">
          <label>Descrição *</label>
          <input
            value={despesa.descricao}
            onChange={(e) => set({ descricao: e.target.value })}
            placeholder="Ex.: aluguel, internet, DAS do MEI…"
            aria-invalid={!!erros.descricao}
            autoFocus
          />
          {erros.descricao && <span className="dsp-erro">{erros.descricao}</span>}
        </div>

        <div className="dsp-campo">
          <label>Categoria *</label>
          <select value={despesa.categoria} onChange={(e) => set({ categoria: e.target.value as CategoriaDespesaFixa })}>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {ROTULO_CATEGORIA_DESPESA[c]}
              </option>
            ))}
          </select>
        </div>

        {despesa.categoria === 'fornecedor' && (
          <div className="dsp-campo">
            <label>Fornecedor *</label>
            <select
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
            {erros.fornecedorId && <span className="dsp-erro">{erros.fornecedorId}</span>}
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
          <label>{despesa.tipoValor === 'variavel' ? 'Valor médio (R$) *' : 'Valor (R$) *'}</label>
          <input
            inputMode="decimal"
            value={despesa.valor}
            onChange={(e) => set({ valor: e.target.value })}
            placeholder="0,00"
            aria-invalid={!!erros.valor}
          />
          {erros.valor && <span className="dsp-erro">{erros.valor}</span>}
          {despesa.tipoValor === 'variavel' && (
            <span className="dsp-dica">
              Usado como estimativa ao gerar a conta do mês — ajuste pro valor real em Financeiro antes de quitar.
            </span>
          )}
        </div>

        <div className="dsp-campo">
          <label>Dia do vencimento *</label>
          <input
            inputMode="numeric"
            value={despesa.diaVencimento}
            onChange={(e) => set({ diaVencimento: e.target.value })}
            placeholder="1 a 28"
            aria-invalid={!!erros.diaVencimento}
          />
          {erros.diaVencimento && <span className="dsp-erro">{erros.diaVencimento}</span>}
        </div>

      </div>

      <div className="dsp-campo">
        <label>Observações</label>
        <textarea rows={2} value={despesa.observacoes} onChange={(e) => set({ observacoes: e.target.value })} />
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
