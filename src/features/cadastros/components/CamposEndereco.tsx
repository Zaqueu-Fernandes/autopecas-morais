/**
 * ============================================================================
 * CAMPOS DE ENDEREÇO (reutilizável — cliente e fornecedor)
 * ============================================================================
 * Ao digitar o CEP e sair do campo (blur), busca no ViaCEP e preenche
 * logradouro/bairro/cidade/uf. Foca automaticamente no campo "número".
 * Todos os campos permanecem editáveis manualmente.
 *
 * Estilos: usa classes CSS simples (ver cadastros.css). Sem dependência de
 * biblioteca de UI, pra plugar em qualquer projeto.
 */

import { useRef, useState } from 'react';
import type { Endereco, ErrosValidacao } from '../types';
import { buscarCEP, formatarCEP } from '../services/cep';

interface Props {
  valor: Endereco;
  onChange: (patch: Partial<Endereco>) => void;
  erros?: ErrosValidacao;
}

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB',
  'PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

export function CamposEndereco({ valor, onChange, erros = {} }: Props) {
  const [buscando, setBuscando] = useState(false);
  const [avisoCep, setAvisoCep] = useState<string | null>(null);
  const numeroRef = useRef<HTMLInputElement>(null);

  async function handleBlurCep() {
    setAvisoCep(null);
    const res = await (async () => {
      setBuscando(true);
      try {
        return await buscarCEP(valor.cep);
      } finally {
        setBuscando(false);
      }
    })();

    if (res.ok) {
      onChange({
        logradouro: res.endereco.logradouro || valor.logradouro,
        bairro: res.endereco.bairro || valor.bairro,
        cidade: res.endereco.cidade || valor.cidade,
        uf: res.endereco.uf || valor.uf,
      });
      // pula direto pro número, que é o que falta preencher
      numeroRef.current?.focus();
    } else if (res.motivo === 'nao_encontrado') {
      setAvisoCep('CEP não encontrado. Preencha manualmente.');
    } else if (res.motivo === 'falha_rede') {
      setAvisoCep('Não deu pra consultar o CEP agora. Preencha manualmente.');
    }
    // motivo 'invalido' (CEP incompleto): não avisa, usuário ainda digitando
  }

  return (
    <fieldset className="cad-endereco">
      <legend>Endereço</legend>

      <div className="cad-grid">
        <div className="cad-campo cad-cep">
          <label htmlFor="cad-endereco-cep">CEP</label>
          <div className="cad-cep-wrap">
            <input
              id="cad-endereco-cep"
              inputMode="numeric"
              autoComplete="postal-code"
              value={formatarCEP(valor.cep)}
              placeholder="00000-000"
              onChange={(e) => onChange({ cep: e.target.value })}
              onBlur={handleBlurCep}
              aria-invalid={!!erros.cep}
            />
            {buscando && <span className="cad-cep-status" aria-live="polite">buscando…</span>}
          </div>
          {erros.cep && <span className="cad-erro">{erros.cep}</span>}
          {avisoCep && <span className="cad-aviso" aria-live="polite">{avisoCep}</span>}
        </div>

        <div className="cad-campo cad-logradouro">
          <label htmlFor="cad-endereco-logradouro">Logradouro</label>
          <input
            id="cad-endereco-logradouro"
            autoComplete="address-line1"
            value={valor.logradouro}
            placeholder="Rua / Avenida"
            onChange={(e) => onChange({ logradouro: e.target.value })}
            aria-invalid={!!erros.logradouro}
          />
          {erros.logradouro && <span className="cad-erro">{erros.logradouro}</span>}
        </div>

        <div className="cad-campo cad-numero">
          <label htmlFor="cad-endereco-numero">Número</label>
          <input
            id="cad-endereco-numero"
            ref={numeroRef}
            value={valor.numero}
            placeholder="123"
            onChange={(e) => onChange({ numero: e.target.value })}
            aria-invalid={!!erros.numero}
          />
          {erros.numero && <span className="cad-erro">{erros.numero}</span>}
        </div>

        <div className="cad-campo cad-complemento">
          <label htmlFor="cad-endereco-complemento">Complemento</label>
          <input
            id="cad-endereco-complemento"
            autoComplete="address-line2"
            value={valor.complemento}
            placeholder="Sala, fundos, etc. (opcional)"
            onChange={(e) => onChange({ complemento: e.target.value })}
          />
        </div>

        <div className="cad-campo cad-bairro">
          <label htmlFor="cad-endereco-bairro">Bairro</label>
          <input
            id="cad-endereco-bairro"
            value={valor.bairro}
            onChange={(e) => onChange({ bairro: e.target.value })}
            aria-invalid={!!erros.bairro}
          />
          {erros.bairro && <span className="cad-erro">{erros.bairro}</span>}
        </div>

        <div className="cad-campo cad-cidade">
          <label htmlFor="cad-endereco-cidade">Cidade</label>
          <input
            id="cad-endereco-cidade"
            autoComplete="address-level2"
            value={valor.cidade}
            onChange={(e) => onChange({ cidade: e.target.value })}
            aria-invalid={!!erros.cidade}
          />
          {erros.cidade && <span className="cad-erro">{erros.cidade}</span>}
        </div>

        <div className="cad-campo cad-uf">
          <label htmlFor="cad-endereco-uf">UF</label>
          <select
            id="cad-endereco-uf"
            autoComplete="address-level1"
            value={valor.uf}
            onChange={(e) => onChange({ uf: e.target.value })}
            aria-invalid={!!erros.uf}
          >
            <option value="">--</option>
            {UFS.map((uf) => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
          {erros.uf && <span className="cad-erro">{erros.uf}</span>}
        </div>
      </div>
    </fieldset>
  );
}
