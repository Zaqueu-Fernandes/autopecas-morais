/**
 * ============================================================================
 * ETAPAS DA OS — trilha de progresso estilo "acompanhe seu pedido"
 * ============================================================================
 * Aberta → Em andamento → Concluída → Faturada. Etapa concluída fica marcada
 * (check), a etapa atual pulsa, as futuras ficam neutras. O conector entre
 * duas etapas já percorridas acende em vermelho.
 */

import { Fragment } from 'react';
import { ROTULO_STATUS_OS, type StatusOS } from '../types';

const ORDEM_ETAPAS: StatusOS[] = ['aberta', 'em_andamento', 'concluida', 'faturada'];

interface Props {
  statusAtual: StatusOS;
}

function IconeCheck() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconeSeta() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EtapasOS({ statusAtual }: Props) {
  const indiceAtual = ORDEM_ETAPAS.indexOf(statusAtual);

  return (
    <div className="os-etapas" role="list" aria-label="Progresso da ordem de serviço">
      {ORDEM_ETAPAS.map((etapa, i) => {
        const estado = i < indiceAtual ? 'concluida' : i === indiceAtual ? 'atual' : 'pendente';
        return (
          <Fragment key={etapa}>
            {i > 0 && (
              <div className={`os-etapas-conector${i <= indiceAtual ? ' os-etapas-conector-preenchido' : ''}`}>
                <IconeSeta />
              </div>
            )}
            <div className={`os-etapas-passo os-etapas-passo-${estado}`} role="listitem">
              <span className="os-etapas-marcador">
                {estado === 'concluida' ? <IconeCheck /> : <span className="os-etapas-ponto" />}
              </span>
              <span className="os-etapas-rotulo">{ROTULO_STATUS_OS[etapa]}</span>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
