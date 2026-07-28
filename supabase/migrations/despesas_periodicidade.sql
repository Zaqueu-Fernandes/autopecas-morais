-- =============================================================================
-- DESPESAS RECORRENTES — periodicidade (semanal/mensal/anual) + categoria única
-- =============================================================================
-- 1) Funde as categorias 'despesa_fixa' e 'despesa_variavel' numa só
--    ('despesa_geral'): agora que existe tipo_valor (fixo/variável) e
--    periodicidade, ter uma categoria chamada "fixa" e outra "variável" só
--    duplicava/confundia com esses dois campos. fornecedor/imposto/folha/
--    retirada_lucro continuam — são classificação contábil de verdade, não
--    duplicam nada.
-- 2) despesas_fixas ganha `periodicidade` (semanal/mensal/anual) e
--    `mes_vencimento` (só usado quando anual). `dia_vencimento` passa a
--    significar coisas diferentes conforme a periodicidade:
--      mensal  -> dia do mês   (1-28, como já era)
--      anual   -> dia do mês   (1-28) + mes_vencimento (1-12)
--      semanal -> dia da semana (0=domingo … 6=sábado)
--    por isso o check de dia_vencimento fica mais largo (0-28); a validação
--    fina de qual faixa vale pra cada periodicidade é feita na aplicação
--    (ver validarDespesaFixa em despesas/types.ts).
-- 3) financeiro ganha `periodicidade` (nullable — só lançamentos GERADOS de
--    uma despesa recorrente carregam isso; lançamento manual fica NULL).
-- =============================================================================

-- ---- categoria: despesa_fixa/despesa_variavel -> despesa_geral -------------

do $$
declare
  nome_constraint text;
begin
  select conname into nome_constraint
    from pg_constraint
   where conrelid = 'despesas_fixas'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) like '%despesa_fixa%';
  if nome_constraint is not null then
    execute format('alter table despesas_fixas drop constraint %I', nome_constraint);
  end if;
end $$;

update despesas_fixas set categoria = 'despesa_geral' where categoria in ('despesa_fixa', 'despesa_variavel');

alter table despesas_fixas
  add constraint despesas_fixas_categoria_check
  check (categoria in ('fornecedor', 'despesa_geral', 'imposto', 'folha', 'retirada_lucro'));

do $$
declare
  nome_constraint text;
begin
  select conname into nome_constraint
    from pg_constraint
   where conrelid = 'financeiro'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) like '%despesa_fixa%';
  if nome_constraint is not null then
    execute format('alter table financeiro drop constraint %I', nome_constraint);
  end if;
end $$;

update financeiro set categoria = 'despesa_geral' where categoria in ('despesa_fixa', 'despesa_variavel');

alter table financeiro
  add constraint financeiro_check
  check (
    (tipo = 'pagar'   and categoria in ('fornecedor', 'despesa_geral', 'imposto', 'folha', 'retirada_lucro')) or
    (tipo = 'receber' and categoria in ('servico_os', 'venda_balcao'))
  );

-- ---- periodicidade -----------------------------------------------------------

do $$
declare
  nome_constraint text;
begin
  select conname into nome_constraint
    from pg_constraint
   where conrelid = 'despesas_fixas'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) like '%dia_vencimento%';
  if nome_constraint is not null then
    execute format('alter table despesas_fixas drop constraint %I', nome_constraint);
  end if;
end $$;

alter table despesas_fixas
  add constraint despesas_fixas_dia_vencimento_check check (dia_vencimento between 0 and 28);

alter table despesas_fixas
  add column if not exists periodicidade text not null default 'mensal'
    check (periodicidade in ('semanal', 'mensal', 'anual')),
  add column if not exists mes_vencimento integer
    check (mes_vencimento between 1 and 12);

alter table financeiro
  add column if not exists periodicidade text
    check (periodicidade in ('semanal', 'mensal', 'anual'));
