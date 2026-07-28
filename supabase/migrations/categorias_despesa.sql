-- =============================================================================
-- CATEGORIAS DE DESPESA/CONTA A PAGAR — cadastráveis pelo usuário
-- =============================================================================
-- Até aqui, a categoria de despesa recorrente / conta a pagar era uma lista
-- fixa (fornecedor, despesa_geral, imposto, folha, retirada_lucro) travada
-- por CHECK constraint. Vira uma tabela de verdade pra o usuário poder
-- cadastrar categorias novas (aba Cadastros > Categorias).
--
-- `chave` é o identificador ESTÁVEL guardado em despesas_fixas.categoria e
-- financeiro.categoria (texto, sem mudar o tipo dessas colunas — só relaxa o
-- CHECK). As 5 categorias originais viram linhas PROTEGIDAS (protegida=true):
-- não podem ser desativadas/excluídas (algumas têm regra de negócio presa à
-- chave — ver REGRA DE OURO de 'retirada_lucro' em financeiro.sql — e
-- 'fornecedor' controla se o formulário pede o fornecedor). O `nome`
-- (rótulo exibido) delas PODE ser editado — só a chave é imutável.
-- Categoria criada pelo usuário: chave = slug do nome, protegida=false,
-- pode ser renomeada/desativada/excluída (excluída só se nunca foi usada —
-- checado na aplicação, já que chave aqui não é uma FK de verdade).
-- =============================================================================

create table if not exists categorias_despesa (
  id         uuid primary key default gen_random_uuid(),
  chave      text not null unique,
  nome       text not null,
  protegida  boolean not null default false,
  ativa      boolean not null default true,
  created_at timestamptz not null default now()
);

insert into categorias_despesa (chave, nome, protegida) values
  ('fornecedor',     'Fornecedor',          true),
  ('despesa_geral',  'Despesa geral',       true),
  ('imposto',        'Imposto',             true),
  ('folha',          'Folha de pagamento',  true),
  ('retirada_lucro', 'Retirada de lucro',   true)
on conflict (chave) do nothing;

-- ---- relaxa os CHECK antigos: categoria passa a ser validada contra a
--      tabela acima, na aplicação, não mais por uma lista fixa aqui -------

do $$
declare
  nome_constraint text;
begin
  select conname into nome_constraint
    from pg_constraint
   where conrelid = 'despesas_fixas'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) like '%categoria%';
  if nome_constraint is not null then
    execute format('alter table despesas_fixas drop constraint %I', nome_constraint);
  end if;
end $$;

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
    (tipo = 'receber' and categoria in ('servico_os', 'venda_balcao'))
  );
