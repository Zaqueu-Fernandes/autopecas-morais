/**
 * ============================================================================
 * FORMULÁRIO DE NOVA ORDEM DE SERVIÇO
 * ============================================================================
 * Escolhe cliente, depois veículo daquele cliente (lista muda dinamicamente).
 * Se o cliente não tem veículo cadastrado, avisa e bloqueia o envio — a OS
 * precisa de um veículo.
 */

import { useEffect, useState } from 'react';
import { ordemServicoVazia, validarOS, semErros, type OrdemServico, type ErrosValidacao } from '../types';
import { type Cliente, type Veiculo, listarClientes, listarVeiculosPorCliente } from '@/features/cadastros';

interface Props {
  onSalvar: (os: OrdemServico) => Promise<void> | void;
  onCancelar?: () => void;
}

export function FormOS({ onSalvar, onCancelar }: Props) {
  const [os, setOs] = useState<OrdemServico>(ordemServicoVazia());
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [salvando, setSalvando] = useState(false);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [carregandoVeiculos, setCarregandoVeiculos] = useState(false);

  useEffect(() => {
    listarClientes().then(setClientes).catch(() => setClientes([]));
  }, []);

  useEffect(() => {
    if (!os.clienteId) {
      setVeiculos([]);
      return;
    }
    setCarregandoVeiculos(true);
    listarVeiculosPorCliente(os.clienteId)
      .then(setVeiculos)
      .catch(() => setVeiculos([]))
      .finally(() => setCarregandoVeiculos(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [os.clienteId]);

  function set(patch: Partial<OrdemServico>) {
    setOs((o) => ({ ...o, ...patch }));
  }

  async function handleSalvar() {
    const e = validarOS(os);
    setErros(e);
    if (!semErros(e)) {
      if (e.clienteId) document.getElementById('os-form-cliente')?.focus();
      else if (e.veiculoId) document.getElementById('os-form-veiculo')?.focus();
      else if (e.descricaoProblema) document.getElementById('os-form-problema')?.focus();
      return;
    }
    setSalvando(true);
    try {
      await onSalvar(os);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="os-form">
      <div className="os-form-head">
        <h2>Nova ordem de serviço</h2>
      </div>

      <div className="os-grid">
        <div className="os-campo">
          <label htmlFor="os-form-cliente">Cliente *</label>
          <select
            id="os-form-cliente"
            name="clienteId"
            autoComplete="off"
            value={os.clienteId}
            onChange={(e) => set({ clienteId: e.target.value, veiculoId: '' })}
            aria-invalid={!!erros.clienteId}
          >
            <option value="">— selecione —</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          {erros.clienteId && <span className="os-erro">{erros.clienteId}</span>}
        </div>

        <div className="os-campo">
          <label htmlFor="os-form-veiculo">Veículo *</label>
          <select
            id="os-form-veiculo"
            name="veiculoId"
            autoComplete="off"
            value={os.veiculoId}
            onChange={(e) => set({ veiculoId: e.target.value })}
            disabled={!os.clienteId || carregandoVeiculos}
            aria-invalid={!!erros.veiculoId}
          >
            <option value="">
              {!os.clienteId ? '— selecione o cliente primeiro —' : '— selecione —'}
            </option>
            {veiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.placa} — {v.marca} {v.modelo}
              </option>
            ))}
          </select>
          {erros.veiculoId && <span className="os-erro">{erros.veiculoId}</span>}
          {os.clienteId && !carregandoVeiculos && veiculos.length === 0 && (
            <span className="os-aviso">
              Este cliente não tem veículo cadastrado. Cadastre um na tela de Clientes.
            </span>
          )}
        </div>
      </div>

      <div className="os-campo">
        <label htmlFor="os-form-problema">Problema relatado *</label>
        <textarea
          id="os-form-problema"
          name="descricaoProblema"
          autoComplete="off"
          rows={3}
          value={os.descricaoProblema}
          onChange={(e) => set({ descricaoProblema: e.target.value })}
          placeholder="Ex.: barulho na suspensão dianteira, revisão dos 20 mil km…"
          aria-invalid={!!erros.descricaoProblema}
        />
        {erros.descricaoProblema && <span className="os-erro">{erros.descricaoProblema}</span>}
      </div>

      <div className="os-campo">
        <label htmlFor="os-form-observacoes">Observações</label>
        <textarea
          id="os-form-observacoes"
          name="observacoes"
          autoComplete="off"
          rows={2}
          value={os.observacoes}
          onChange={(e) => set({ observacoes: e.target.value })}
        />
      </div>

      <div className="os-acoes">
        {onCancelar && (
          <button type="button" className="os-btn-sec" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button
          type="button"
          className="os-btn"
          onClick={handleSalvar}
          disabled={salvando || (!!os.clienteId && !carregandoVeiculos && veiculos.length === 0)}
        >
          {salvando ? 'Salvando…' : 'Abrir OS'}
        </button>
      </div>
    </div>
  );
}
