/**
 * ============================================================================
 * FORMULÁRIO DE MOVIMENTAÇÃO — ENTRADA, AJUSTE ou DEVOLUÇÃO AO FORNECEDOR
 * ============================================================================
 * Saída por uso é feita pelas features de OS/Venda (ainda não implementadas),
 * não por aqui — no estoque só se registra compra (entrada), correção
 * manual (ajuste, com motivo obrigatório para auditoria) ou devolução ao
 * fornecedor (peça que já tinha entrado sai de novo — defeito ou nota
 * fiscal cancelada).
 */

import { useEffect, useState } from 'react';
import {
  type DadosEntrada,
  type DadosAjuste,
  type DadosDevolucaoFornecedor,
  type MotivoDevolucaoFornecedor,
  dadosEntradaVazio,
  dadosAjusteVazio,
  dadosDevolucaoFornecedorVazio,
  validarEntrada,
  validarAjuste,
  validarDevolucaoFornecedor,
  semErros,
  ROTULO_MOTIVO_DEVOLUCAO_FORNECEDOR,
  type ErrosValidacao,
} from '../types';
import { type Fornecedor, listarFornecedores } from '@/features/cadastros';
import { type Empresa, listarEmpresas } from '@/features/empresa';

interface PropsEntrada {
  tipo: 'entrada';
  onSalvar: (d: DadosEntrada) => Promise<void> | void;
  onCancelar?: () => void;
}

interface PropsAjuste {
  tipo: 'ajuste';
  onSalvar: (d: DadosAjuste) => Promise<void> | void;
  onCancelar?: () => void;
}

interface PropsDevolucaoFornecedor {
  tipo: 'devolucaoFornecedor';
  onSalvar: (d: DadosDevolucaoFornecedor) => Promise<void> | void;
  onCancelar?: () => void;
}

type Props = PropsEntrada | PropsAjuste | PropsDevolucaoFornecedor;

export function FormMovimentacao(props: Props) {
  if (props.tipo === 'entrada') return <FormEntrada {...props} />;
  if (props.tipo === 'ajuste') return <FormAjuste {...props} />;
  return <FormDevolucaoFornecedor {...props} />;
}

function FormEntrada({ onSalvar, onCancelar }: PropsEntrada) {
  const [dados, setDados] = useState<DadosEntrada>(dadosEntradaVazio());
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

  function set(patch: Partial<DadosEntrada>) {
    setDados((d) => ({ ...d, ...patch }));
  }

  async function handleSalvar() {
    const e = validarEntrada(dados);
    setErros(e);
    if (!semErros(e)) {
      const ordem: Array<[string, string]> = [
        ['quantidade', 'est-entrada-quantidade'],
        ['custoUnit', 'est-entrada-custo'],
        ['empresaId', 'est-entrada-empresa'],
      ];
      const primeiro = ordem.find(([chave]) => e[chave]);
      if (primeiro) document.getElementById(primeiro[1])?.focus();
      return;
    }
    setSalvando(true);
    try {
      await onSalvar(dados);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="est-form">
      <div className="est-form-head">
        <h2>Registrar entrada</h2>
      </div>

      <div className="est-grid">
        <div className="est-campo">
          <label htmlFor="est-entrada-quantidade">Quantidade *</label>
          <input
            id="est-entrada-quantidade"
            name="quantidade"
            autoComplete="off"
            inputMode="numeric"
            value={dados.quantidade}
            onChange={(e) => set({ quantidade: e.target.value })}
            aria-invalid={!!erros.quantidade}
            autoFocus
          />
          {erros.quantidade && <span className="est-erro">{erros.quantidade}</span>}
        </div>

        <div className="est-campo">
          <label htmlFor="est-entrada-custo">Custo unitário (R$) *</label>
          <input
            id="est-entrada-custo"
            name="custoUnit"
            autoComplete="off"
            inputMode="decimal"
            value={dados.custoUnit}
            onChange={(e) => set({ custoUnit: e.target.value })}
            placeholder="0,00"
            aria-invalid={!!erros.custoUnit}
          />
          {erros.custoUnit && <span className="est-erro">{erros.custoUnit}</span>}
        </div>

        <div className="est-campo est-col-2">
          <label htmlFor="est-entrada-empresa">Empresa (CNPJ) *</label>
          <select
            id="est-entrada-empresa"
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
          {erros.empresaId && <span className="est-erro">{erros.empresaId}</span>}
          {empresas.length === 0 && (
            <span className="est-aviso">Cadastre uma empresa na aba Empresas antes de dar entrada.</span>
          )}
        </div>

        <div className="est-campo est-col-2">
          <label htmlFor="est-entrada-fornecedor">Fornecedor</label>
          <select
            id="est-entrada-fornecedor"
            value={dados.fornecedorId}
            onChange={(e) => set({ fornecedorId: e.target.value })}
          >
            <option value="">— não informado —</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="est-campo">
        <label htmlFor="est-entrada-observacoes">Observações</label>
        <textarea
          id="est-entrada-observacoes"
          name="observacoes"
          autoComplete="off"
          rows={2}
          value={dados.observacoes}
          onChange={(e) => set({ observacoes: e.target.value })}
        />
      </div>

      <div className="est-acoes">
        {onCancelar && (
          <button type="button" className="est-btn-sec" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="button" className="est-btn" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Registrar entrada'}
        </button>
      </div>
    </div>
  );
}

function FormAjuste({ onSalvar, onCancelar }: PropsAjuste) {
  const [dados, setDados] = useState<DadosAjuste>(dadosAjusteVazio());
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [salvando, setSalvando] = useState(false);

  function set(patch: Partial<DadosAjuste>) {
    setDados((d) => ({ ...d, ...patch }));
  }

  async function handleSalvar() {
    const e = validarAjuste(dados);
    setErros(e);
    if (!semErros(e)) {
      const ordem: Array<[string, string]> = [
        ['quantidade', 'est-ajuste-quantidade'],
        ['observacoes', 'est-ajuste-motivo'],
      ];
      const primeiro = ordem.find(([chave]) => e[chave]);
      if (primeiro) document.getElementById(primeiro[1])?.focus();
      return;
    }
    setSalvando(true);
    try {
      await onSalvar(dados);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="est-form">
      <div className="est-form-head">
        <h2>Ajustar estoque</h2>
      </div>

      <div className="est-tipo">
        <button
          type="button"
          className={dados.sentido === 'aumentar' ? 'ativo' : ''}
          aria-pressed={dados.sentido === 'aumentar'}
          onClick={() => set({ sentido: 'aumentar' })}
        >
          Aumentar
        </button>
        <button
          type="button"
          className={dados.sentido === 'diminuir' ? 'ativo' : ''}
          aria-pressed={dados.sentido === 'diminuir'}
          onClick={() => set({ sentido: 'diminuir' })}
        >
          Diminuir
        </button>
      </div>

      <div className="est-grid">
        <div className="est-campo">
          <label htmlFor="est-ajuste-quantidade">Quantidade *</label>
          <input
            id="est-ajuste-quantidade"
            name="quantidade"
            autoComplete="off"
            inputMode="numeric"
            value={dados.quantidade}
            onChange={(e) => set({ quantidade: e.target.value })}
            aria-invalid={!!erros.quantidade}
            autoFocus
          />
          {erros.quantidade && <span className="est-erro">{erros.quantidade}</span>}
        </div>
      </div>

      <div className="est-campo">
        <label htmlFor="est-ajuste-motivo">Motivo *</label>
        <textarea
          id="est-ajuste-motivo"
          name="observacoes"
          autoComplete="off"
          rows={2}
          value={dados.observacoes}
          onChange={(e) => set({ observacoes: e.target.value })}
          placeholder="Ex.: contagem física encontrou divergência, peça quebrada…"
          aria-invalid={!!erros.observacoes}
        />
        {erros.observacoes && <span className="est-erro">{erros.observacoes}</span>}
      </div>

      <div className="est-acoes">
        {onCancelar && (
          <button type="button" className="est-btn-sec" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="button" className="est-btn" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Registrar ajuste'}
        </button>
      </div>
    </div>
  );
}

const MOTIVOS_DEVOLUCAO = Object.keys(ROTULO_MOTIVO_DEVOLUCAO_FORNECEDOR) as MotivoDevolucaoFornecedor[];

function FormDevolucaoFornecedor({ onSalvar, onCancelar }: PropsDevolucaoFornecedor) {
  const [dados, setDados] = useState<DadosDevolucaoFornecedor>(dadosDevolucaoFornecedorVazio());
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [salvando, setSalvando] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);

  useEffect(() => {
    listarFornecedores().then(setFornecedores).catch(() => setFornecedores([]));
  }, []);

  function set(patch: Partial<DadosDevolucaoFornecedor>) {
    setDados((d) => ({ ...d, ...patch }));
  }

  async function handleSalvar() {
    const e = validarDevolucaoFornecedor(dados);
    setErros(e);
    if (!semErros(e)) {
      // Motivo não é um único input — foca o primeiro botão do grupo quando é ele que falha.
      const idPrimeiroMotivo = `est-dev-motivo-${MOTIVOS_DEVOLUCAO[0]}`;
      const ordem: Array<[string, string]> = [
        ['quantidade', 'est-dev-quantidade'],
        ['motivo', idPrimeiroMotivo],
      ];
      const primeiro = ordem.find(([chave]) => e[chave]);
      if (primeiro) document.getElementById(primeiro[1])?.focus();
      return;
    }
    setSalvando(true);
    try {
      await onSalvar(dados);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="est-form">
      <div className="est-form-head">
        <h2>Devolver ao fornecedor</h2>
      </div>

      <p className="est-aviso">
        Pra peça que já tinha dado entrada e precisa sair de novo do estoque — defeito ou nota fiscal cancelada.
      </p>

      <div className="est-tipo">
        {MOTIVOS_DEVOLUCAO.map((m) => (
          <button
            key={m}
            id={`est-dev-motivo-${m}`}
            type="button"
            className={dados.motivo === m ? 'ativo' : ''}
            aria-pressed={dados.motivo === m}
            onClick={() => set({ motivo: m })}
          >
            {ROTULO_MOTIVO_DEVOLUCAO_FORNECEDOR[m]}
          </button>
        ))}
      </div>
      {erros.motivo && <span className="est-erro">{erros.motivo}</span>}

      <div className="est-grid">
        <div className="est-campo">
          <label htmlFor="est-dev-quantidade">Quantidade *</label>
          <input
            id="est-dev-quantidade"
            name="quantidade"
            autoComplete="off"
            inputMode="numeric"
            value={dados.quantidade}
            onChange={(e) => set({ quantidade: e.target.value })}
            aria-invalid={!!erros.quantidade}
            autoFocus
          />
          {erros.quantidade && <span className="est-erro">{erros.quantidade}</span>}
        </div>

        <div className="est-campo est-col-2">
          <label htmlFor="est-dev-fornecedor">Fornecedor</label>
          <select
            id="est-dev-fornecedor"
            value={dados.fornecedorId}
            onChange={(e) => set({ fornecedorId: e.target.value })}
          >
            <option value="">— não informado —</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="est-campo">
        <label htmlFor="est-dev-observacoes">Observações</label>
        <textarea
          id="est-dev-observacoes"
          name="observacoes"
          autoComplete="off"
          rows={2}
          value={dados.observacoes}
          onChange={(e) => set({ observacoes: e.target.value })}
          placeholder="Ex.: número da nota, o que foi combinado com o fornecedor…"
        />
      </div>

      <div className="est-acoes">
        {onCancelar && (
          <button type="button" className="est-btn-sec" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="button" className="est-btn" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Registrar devolução'}
        </button>
      </div>
    </div>
  );
}
