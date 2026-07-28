-- =============================================================================
-- DESPESAS FIXAS — valor fixo x variável (estimativa)
-- =============================================================================
-- Algumas despesas fixas têm valor sempre igual (aluguel, mensalidade); outras
-- variam todo mês (água, luz, telefone) mas ainda têm dia de vencimento fixo.
-- tipo_valor deixa o usuário avisar qual é qual: 'fixo' mantém o campo valor
-- como o valor real; 'variavel' trata valor como MÉDIA/estimativa — o valor
-- real é ajustado depois em Financeiro (ver atualizarValorLancamento), antes
-- de quitar a conta gerada.
-- =============================================================================

alter table despesas_fixas
  add column if not exists tipo_valor text not null default 'fixo'
    check (tipo_valor in ('fixo', 'variavel'));
