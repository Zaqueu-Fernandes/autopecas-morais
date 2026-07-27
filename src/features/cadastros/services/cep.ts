/**
 * ============================================================================
 * BUSCA DE CEP — ViaCEP
 * ============================================================================
 * API pública e gratuita (https://viacep.com.br), sem cadastro/chave.
 * Recebe um CEP, devolve logradouro/bairro/cidade/uf pra preencher o form.
 *
 * O usuário digita só o CEP e o número; o resto vem preenchido. Ele pode
 * sempre editar manualmente (CEP genérico de cidade não traz logradouro).
 */

export interface EnderecoViaCEP {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export type ResultadoCEP =
  | { ok: true; endereco: EnderecoViaCEP }
  | { ok: false; motivo: 'invalido' | 'nao_encontrado' | 'falha_rede' };

/** Remove tudo que não é dígito. */
export function limparCEP(cep: string): string {
  return (cep ?? '').replace(/\D/g, '');
}

/** Formata para exibição: 63000-000 */
export function formatarCEP(cep: string): string {
  const d = limparCEP(cep).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

/**
 * Busca o endereço pelo CEP. Nunca lança — sempre devolve um ResultadoCEP,
 * pra tela tratar com mensagem amigável.
 */
export async function buscarCEP(cep: string): Promise<ResultadoCEP> {
  const limpo = limparCEP(cep);
  if (limpo.length !== 8) return { ok: false, motivo: 'invalido' };

  try {
    const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
    if (!res.ok) return { ok: false, motivo: 'falha_rede' };

    const data = await res.json();
    if (data?.erro) return { ok: false, motivo: 'nao_encontrado' };

    return {
      ok: true,
      endereco: {
        logradouro: data.logradouro ?? '',
        bairro: data.bairro ?? '',
        cidade: data.localidade ?? '',
        uf: data.uf ?? '',
      },
    };
  } catch {
    return { ok: false, motivo: 'falha_rede' };
  }
}
