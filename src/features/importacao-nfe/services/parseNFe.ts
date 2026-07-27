/**
 * ============================================================================
 * PARSER DE XML DA NF-e
 * ============================================================================
 * Usa o DOMParser nativo do navegador — sem biblioteca externa. Lê só os
 * campos que interessam pra dar entrada no estoque (emitente, itens, chave
 * de acesso). Não valida assinatura/autenticidade da nota — assume que o
 * arquivo veio de uma fonte confiável (o próprio fornecedor).
 *
 * Layout esperado (padrão NF-e do SEFAZ, modelo 55/65):
 *   infNFe > ide (nNF, serie) | emit (CNPJ, xNome) | det > prod (cProd,
 *   xProd, uCom, qCom, vUnCom) | total > ICMSTot (vNF)
 * Chave de acesso vem de protNFe/infProt/chNFe, ou do atributo Id do
 * próprio infNFe (formato "NFe" + 44 dígitos) quando a nota ainda não tem
 * protocolo de autorização anexado.
 */

import type { DadosNFeExtraida, ItemNFeExtraido } from '../types';

function textoDe(pai: Element | Document, tag: string): string {
  return pai.getElementsByTagName(tag)[0]?.textContent?.trim() ?? '';
}

function numeroDe(pai: Element | Document, tag: string): number {
  const texto = textoDe(pai, tag);
  return texto ? Number(texto) : 0;
}

export function parseNFe(xmlTexto: string): DadosNFeExtraida {
  const doc = new DOMParser().parseFromString(xmlTexto, 'text/xml');

  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Arquivo XML inválido ou corrompido.');
  }

  const infNFe = doc.getElementsByTagName('infNFe')[0];
  if (!infNFe) {
    throw new Error('Não encontrei os dados da nota fiscal (infNFe) neste XML.');
  }

  const emit = infNFe.getElementsByTagName('emit')[0];
  if (!emit) {
    throw new Error('Não encontrei os dados do emitente (fornecedor) neste XML.');
  }

  const ide = infNFe.getElementsByTagName('ide')[0];

  let chaveAcesso = textoDe(doc, 'chNFe');
  if (!chaveAcesso) {
    chaveAcesso = (infNFe.getAttribute('Id') ?? '').replace(/^NFe/, '');
  }
  if (!/^\d{44}$/.test(chaveAcesso)) {
    throw new Error('Não consegui identificar a chave de acesso da nota (44 dígitos).');
  }

  const dets = Array.from(infNFe.getElementsByTagName('det'));
  if (dets.length === 0) {
    throw new Error('Esta nota não tem nenhum item de produto (det/prod).');
  }

  const itens: ItemNFeExtraido[] = dets.map((det, i) => {
    const prod = det.getElementsByTagName('prod')[0];
    if (!prod) throw new Error(`Item ${i + 1} da nota está sem dados de produto.`);
    return {
      codigoProduto: textoDe(prod, 'cProd'),
      descricao: textoDe(prod, 'xProd') || `Item ${i + 1}`,
      unidade: (textoDe(prod, 'uCom') || 'un').toLowerCase(),
      quantidade: numeroDe(prod, 'qCom'),
      valorUnitario: numeroDe(prod, 'vUnCom'),
    };
  });

  return {
    chaveAcesso,
    numero: textoDe(ide, 'nNF'),
    serie: textoDe(ide, 'serie'),
    fornecedorCnpj: textoDe(emit, 'CNPJ').replace(/\D/g, ''),
    fornecedorNome: textoDe(emit, 'xNome') || 'Fornecedor sem nome na nota',
    valorTotal: numeroDe(infNFe, 'vNF'),
    itens,
  };
}
