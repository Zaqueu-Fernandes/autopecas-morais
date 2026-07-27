/**
 * ============================================================================
 * BOTÃO DE IMPRIMIR — dispara printer.imprimir(doc)
 * ============================================================================
 * Reutilizável em qualquer tela (OS, Venda...). Recebe a classe do botão de
 * quem chama, pra herdar o estilo da feature (os-btn-sec, vd-btn-sec etc.).
 */

import { Printer } from 'lucide-react';
import { printer } from '../services/printer.service';
import type { DocumentoImpressao } from '../types';

interface Props {
  documento: DocumentoImpressao;
  className?: string;
  label?: string;
}

export function BotaoImprimir({ documento, className, label = 'Imprimir comprovante' }: Props) {
  return (
    <button type="button" className={className} onClick={() => printer.imprimir(documento)}>
      <Printer size={15} /> {label}
    </button>
  );
}
