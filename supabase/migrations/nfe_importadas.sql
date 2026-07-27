-- =============================================================================
-- NF-e IMPORTADAS — controle pra não dar entrada duas vezes na mesma nota
-- =============================================================================
-- Só registra QUE uma nota foi importada (chave de acesso é única de verdade,
-- 44 dígitos). Os itens da nota viram movimentacao_estoque (tipo='entrada')
-- normalmente, via registrarEntrada — esta tabela é só o controle de
-- duplicidade + um histórico simples de quais notas já entraram no sistema.
-- =============================================================================

create table if not exists nfe_importadas (
  id             uuid primary key default gen_random_uuid(),
  chave_acesso   text not null unique,
  numero         text,
  serie          text,
  fornecedor_id  uuid references fornecedores(id),
  valor_total    numeric(10,2),
  importado_em   timestamptz not null default now()
);

create index if not exists idx_nfe_importadas_fornecedor on nfe_importadas (fornecedor_id);
