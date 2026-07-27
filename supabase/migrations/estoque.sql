-- =============================================================================
-- ESTOQUE: PEÇAS + RAZÃO DE MOVIMENTAÇÃO
-- =============================================================================
-- pecas.qtd e pecas.preco_custo são CACHE. O saldo real é sempre a soma do
-- razão (movimentacao_estoque) — nunca editar pecas.qtd na mão.
-- movimentacao_estoque é um razão: só INSERT pela aplicação, nunca UPDATE/DELETE.
-- =============================================================================

create table if not exists pecas (
  id           uuid primary key default gen_random_uuid(),
  codigo       text,                       -- código interno / SKU (opcional)
  nome         text not null,
  descricao    text,
  unidade      text not null default 'un', -- un, cx, litro, kg, par...
  categoria    text,

  preco_custo  numeric(10,2) not null default 0, -- cache: último custo de entrada
  preco_venda  numeric(10,2) not null default 0,
  qtd          integer not null default 0,       -- cache: saldo somado do razão

  ativo        boolean not null default true,    -- desativa em vez de excluir (há histórico)
  observacoes  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_pecas_nome   on pecas (lower(nome));
create index if not exists idx_pecas_codigo on pecas (codigo);

drop trigger if exists trg_pecas_updated on pecas;
create trigger trg_pecas_updated
  before update on pecas
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- RAZÃO DE ESTOQUE (append-only)
-- ---------------------------------------------------------------------------
-- tipo:
--   'entrada' -> compra de fornecedor, quantidade sempre positiva
--   'saida'   -> baixa por uso (OS ou venda), quantidade sempre positiva
--   'ajuste'  -> correção manual, quantidade pode ser negativa (ex.: perda/quebra)
create table if not exists movimentacao_estoque (
  id            uuid primary key default gen_random_uuid(),
  peca_id       uuid not null references pecas(id),

  tipo          text not null check (tipo in ('entrada', 'saida', 'ajuste')),
  quantidade    integer not null check (
    (tipo in ('entrada', 'saida') and quantidade > 0) or
    (tipo = 'ajuste' and quantidade <> 0)
  ),
  custo_unit    numeric(10,2),              -- só preenchido em 'entrada'
  fornecedor_id uuid references fornecedores(id), -- só relevante em 'entrada'

  origem        text,                       -- 'compra_fornecedor' | 'os' | 'venda_balcao' | 'ajuste_manual'...
  observacoes   text,                       -- em 'ajuste', serve de motivo (auditoria)
  created_at    timestamptz not null default now()
);

create index if not exists idx_movimentacao_peca_data
  on movimentacao_estoque (peca_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Trigger: aplica a movimentação no saldo/custo cacheados de pecas
-- ---------------------------------------------------------------------------
create or replace function aplicar_movimentacao_estoque()
returns trigger as $$
declare
  delta        integer;
  saldo_atual  integer;
begin
  delta := case new.tipo
    when 'entrada' then new.quantidade
    when 'saida'   then -new.quantidade
    when 'ajuste'  then new.quantidade
  end;

  select qtd into saldo_atual from pecas where id = new.peca_id for update;

  if saldo_atual + delta < 0 then
    raise exception
      'Estoque insuficiente para a peça %: saldo atual %, movimentação %',
      new.peca_id, saldo_atual, new.quantidade;
  end if;

  update pecas
     set qtd         = saldo_atual + delta,
         preco_custo = coalesce(new.custo_unit, preco_custo)
   where id = new.peca_id;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_movimentacao_aplica on movimentacao_estoque;
create trigger trg_movimentacao_aplica
  after insert on movimentacao_estoque
  for each row execute function aplicar_movimentacao_estoque();

-- =============================================================================
-- NOTA: movimentacao_estoque é um razão contábil — a aplicação só faz INSERT.
-- Correções entram como nova linha tipo 'ajuste', nunca UPDATE/DELETE de uma
-- movimentação existente (perderia a trilha de auditoria).
-- =============================================================================
