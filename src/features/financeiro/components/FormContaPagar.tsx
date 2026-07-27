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
  type CategoriaPagar,
  dadosContaPagarVazio,
  validarContaPagar,
  semErros,
  ROTULO_CATEGORIA_PAGAR,
  type ErrosValidacao,
} from '../types';
import { type Fornecedor, listarFornecedores } from '@/features/cadastros';
import { type Empresa, listarEmpresas } from '@/features/empresa';

interface Props {
  onSalvar: (d: DadosContaPagar) => Promise<void> | void;
  onCancelar?: () => void;
}

const CATEGORIAS = Object.keys(ROTULO_CATEGORIA_PAGAR) as CategoriaPagar[];

export function FormContaPagar({ onSalvar, onCancelar }: Props) {
  const [dados, setDados] = useState<DadosContaPagar>(dadosContaPagarVazio());
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [salvando, setSalvando] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  useEffect(() => {
    listarFornecedores().then(setFornecedores).catch(() => setFornecedores([]));
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
    setSalvando(true);
    try {
      await onSalvar(dados);
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
          <label>Empresa (CNPJ) *</label>
          <select
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
          {erros.empresaId && <span className="fin-erro">{erros.empresaId}</span>}
        </div>

        <div className="fin-campo">
          <label>Categoria *</label>
          <select value={dados.categoria} onChange={(e) => set({ categoria: e.target.value as CategoriaPagar })}>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {ROTULO_CATEGORIA_PAGAR[c]}
              </option>
            ))}
          </select>
        </div>

        {dados.categoria === 'fornecedor' && (
          <div className="fin-campo">
            <label>Fornecedor *</label>
            <select
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
            {erros.fornecedorId && <span className="fin-erro">{erros.fornecedorId}</span>}
          </div>
        )}

        <div className="fin-campo fin-col-2">
          <label>Descrição *</label>
          <input
            value={dados.descricao}
            onChange={(e) => set({ descricao: e.target.value })}
            placeholder="Ex.: compra de peças, conta de luz…"
            aria-invalid={!!erros.descricao}
            autoFocus
          />
          {erros.descricao && <span className="fin-erro">{erros.descricao}</span>}
        </div>

        <div className="fin-campo">
          <label>Valor (R$) *</label>
          <input
            inputMode="decimal"
            value={dados.valor}
            onChange={(e) => set({ valor: e.target.value })}
            placeholder="0,00"
            aria-invalid={!!erros.valor}
          />
          {erros.valor && <span className="fin-erro">{erros.valor}</span>}
        </div>

        <div className="fin-campo">
          <label>Vencimento *</label>
          <input
            type="date"
            value={dados.vencimento}
            onChange={(e) => set({ vencimento: e.target.value })}
            aria-invalid={!!erros.vencimento}
          />
          {erros.vencimento && <span className="fin-erro">{erros.vencimento}</span>}
        </div>
      </div>

      <div className="fin-campo">
        <label>Observações</label>
        <textarea rows={2} value={dados.observacoes} onChange={(e) => set({ observacoes: e.target.value })} />
      </div>

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
