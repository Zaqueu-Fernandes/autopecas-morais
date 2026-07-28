/**
 * ============================================================================
 * BOTÃO — ALTERNAR FORMATO DE IMPRESSÃO (térmica 80mm x A4/Carta)
 * ============================================================================
 * Fica no cabeçalho, ao lado do alternador de tema. Preferência única pra
 * todo o app: comprovante de OS/Venda e as listas impressas (Clientes,
 * Estoque…) usam o mesmo formato escolhido aqui.
 */

import { Receipt, FileText } from 'lucide-react';
import { useFormatoImpressao } from '../hooks/useFormatoImpressao';

export function AlternarFormatoImpressao() {
  const { formato, alternar } = useFormatoImpressao();

  return (
    <button
      type="button"
      className="app-tema-btn"
      onClick={alternar}
      aria-label={formato === 'termica' ? 'Mudar impressão para folha A4/Carta' : 'Mudar impressão para térmica 80mm'}
      title={formato === 'termica' ? 'Impressão: térmica 80mm (clique pra A4/Carta)' : 'Impressão: A4/Carta (clique pra térmica 80mm)'}
    >
      {formato === 'termica' ? <Receipt size={17} /> : <FileText size={17} />}
    </button>
  );
}
