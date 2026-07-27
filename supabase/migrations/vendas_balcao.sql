-- =============================================================================
-- VENDAS DE BALCÃO
-- =============================================================================
-- Venda avulsa de peças (sem OS/veículo envolvido). Cliente é opcional — só
-- vira obrigatório se a venda for finalizada como a_prazo/fiado (precisa
-- amarrar a alguém). Item dá baixa de estoque na hora, igual à OS.
-- =============================================================================

create table if not exists vendas_balcao (
  id           uuid primary key default gen_random_uuid(),
  numero       bigserial not null unique,

  cliente_id   uuid references clientes(id), -- opcional (venda avulsa, sem cadastro)
  status       text not null default 'aberta' check (status in ('aberta', 'finalizada')),
  observacoes  text,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_vendas_cliente on vendas_balcao (cliente_id);
create index if not exists idx_vendas_status  on vendas_balcao (status);

drop trigger if exists trg_vendas_updated on vendas_balcao;
create trigger trg_vendas_updated
  before update on vendas_balcao
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- ITENS DA VENDA (só peça — balcão vende peça, não mão de obra)
-- ---------------------------------------------------------------------------
create table if not exists venda_itens (
  id              uuid primary key default gen_random_uuid(),
  venda_id        uuid not null references vendas_balcao(id) on delete cascade,

  peca_id         uuid not null references pecas(id),
  movimentacao_id uuid references movimentacao_estoque(id),

  descricao       text not null, -- snapshot do nome da peça
  quantidade      integer not null default 1 check (quantidade > 0),
  valor_unit      numeric(10,2) not null default 0,

  removido        boolean not null default false,
  motivo_remocao  text,

  created_at      timestamptz not null default now()
);

create index if not exists idx_venda_itens_venda on venda_itens (venda_id);

-- ---------------------------------------------------------------------------
-- financeiro precisa saber de qual venda veio o lançamento (igual já faz com
-- os_id pra Ordens de Serviço).
-- ---------------------------------------------------------------------------
alter table financeiro add column if not exists venda_id uuid references vendas_balcao(id);
create index if not exists idx_financeiro_venda on financeiro (venda_id);
