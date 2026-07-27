-- =============================================================================
-- VEÍCULOS (sempre vinculados a um cliente)
-- =============================================================================
-- Cada veículo pertence a um cliente. Ao excluir o cliente, os veículos dele
-- são excluídos junto (on delete cascade) — não faz sentido veículo órfão.
-- =============================================================================

create table if not exists veiculos (
  id             uuid primary key default gen_random_uuid(),
  cliente_id     uuid not null references clientes(id) on delete cascade,

  placa          text not null,
  marca          text,
  modelo         text,
  ano            integer,
  cor            text,
  quilometragem  integer,

  observacoes    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_veiculos_cliente on veiculos (cliente_id);
create index if not exists idx_veiculos_placa    on veiculos (upper(placa));

-- Reaproveita a função set_updated_at() criada em cadastros.sql.
drop trigger if exists trg_veiculos_updated on veiculos;
create trigger trg_veiculos_updated
  before update on veiculos
  for each row execute function set_updated_at();
