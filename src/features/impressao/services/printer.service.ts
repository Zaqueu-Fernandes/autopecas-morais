/**
 * ============================================================================
 * PRINTER SERVICE — camada única de impressão
 * ============================================================================
 * Telas chamam só `printer.imprimir(doc)`; não sabem COMO a impressão
 * acontece por baixo dos panos. Isso importa pras fases futuras:
 *
 *   Fase 1 (atual): método 'browser' — monta um HTML 80mm num iframe
 *   escondido e aciona o diálogo de impressão do navegador/SO. Funciona com
 *   qualquer impressora térmica instalada como impressora do Windows/Android.
 *
 *   Fase 2 (futuro): método 'escpos' via Web Bluetooth/USB, falando direto
 *   com a impressora térmica (sem diálogo do SO). Troca só a implementação
 *   de imprimir() — a assinatura pras telas continua a mesma.
 *
 *   Fase 3 (ao virar ME): o DANFE pronto do emissor (PlugNotas/Focus/eNotas)
 *   entra por aqui também, no campo doc.fiscal.
 */

import { gerarHtmlComprovante } from './template';
import type { DocumentoImpressao } from '../types';

function imprimirViaBrowser(html: string): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const documento = iframe.contentDocument;
  if (!documento) {
    document.body.removeChild(iframe);
    throw new Error('Não foi possível preparar a impressão.');
  }

  documento.open();
  documento.write(html);
  documento.close();

  function limpar() {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  }

  iframe.contentWindow?.addEventListener('afterprint', limpar);
  setTimeout(limpar, 60_000); // segurança: remove mesmo se 'afterprint' não disparar

  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  };
}

export const printer = {
  imprimir(doc: DocumentoImpressao): void {
    imprimirViaBrowser(gerarHtmlComprovante(doc));
  },
};
