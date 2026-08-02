-- =============================================================================
-- CATEGORIA "RECEITA AVULSA" — lançamento manual de receita (Contas a Receber)
-- =============================================================================
-- `financeiro_check` (criado em financeiro_estorno.sql) travava a categoria
-- de tipo='receber' numa lista fixa: ('servico_os', 'venda_balcao', 'estorno').
-- A categoria nova 'receita_avulsa' (Contas a Receber > "Nova conta a
-- receber" — a única forma de lançar receita manualmente, pra dinheiro que
-- não vem de faturar OS nem finalizar venda) não estava nessa lista, então
-- todo INSERT quebrava no banco (23514) mesmo passando pela validação da
-- aplicação. Mesmo padrão de drop-e-recria já usado em categorias_despesa.sql/
-- despesas_periodicidade.sql/financeiro_estorno.sql.
-- =============================================================================

do $$
declare
  nome_constraint text;
begin
  select conname into nome_constraint
    from pg_constraint
   where conrelid = 'financeiro'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) like '%categoria%';
  if nome_constraint is not null then
    execute format('alter table financeiro drop constraint %I', nome_constraint);
  end if;
end $$;

alter table financeiro
  add constraint financeiro_check
  check (
    (tipo = 'pagar'   and categoria is not null and categoria <> '') or
    (tipo = 'receber' and categoria in ('servico_os', 'venda_balcao', 'estorno', 'receita_avulsa'))
  );
