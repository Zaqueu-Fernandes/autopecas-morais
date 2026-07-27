-- =============================================================================
-- DESPESAS FIXAS (recorrentes) + geração de contas do mês
-- =============================================================================
-- despesas_fixas guarda a DEFINIÇÃO recorrente (aluguel, internet, DAS do
-- MEI, contador...). "Gerar contas do mês" (feature, não trigger) cria uma
-- linha em financeiro (tipo='pagar') pra cada despesa ativa, com vencimento
-- no dia_vencimento do mês de referência.
--
-- O índice único (despesa_fixa_id, vencimento) impede gerar a mesma despesa
-- duas vezes no mesmo mês — rodar "gerar" de novo só ignora as que já existem.
-- =============================================================================

create table if not exists despesas_fixas (
  id             uuid primary key default gen_random_uuid(),
  descricao      text not null,
  categoria      text not null default 'despesa_fixa'
                   check (categoria in ('fornecedor', 'despesa_fixa', 'despesa_variavel', 'imposto', 'folha', 'retirada_lucro')),
  valor          numeric(10,2) not null check (valor > 0),
  dia_vencimento integer not null check (dia_vencimento between 1 and 28), -- <=28 evita problema em fevereiro

  fornecedor_id  uuid references fornecedores(id), -- opcional (ex.: contador, provedor de internet)
  ativo          boolean not null default true,    -- desativa em vez de excluir (pode ter contas geradas)
  observacoes    text,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_despesas_fixas_ativo on despesas_fixas (ativo);

drop trigger if exists trg_despesas_fixas_updated on despesas_fixas;
create trigger trg_despesas_fixas_updated
  before update on despesas_fixas
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- financeiro precisa saber de qual despesa fixa veio o lançamento, e não
-- pode duplicar geração no mesmo mês.
-- ---------------------------------------------------------------------------
alter table financeiro add column if not exists despesa_fixa_id uuid references despesas_fixas(id);

create unique index if not exists idx_financeiro_despesa_fixa_mes
  on financeiro (despesa_fixa_id, vencimento)
  where despesa_fixa_id is not null;
