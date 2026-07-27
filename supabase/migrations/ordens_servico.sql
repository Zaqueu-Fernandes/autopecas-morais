-- =============================================================================
-- ORDENS DE SERVIÇO
-- =============================================================================
-- Fluxo: aberta → em_andamento → concluida → faturada.
-- Faturamento é feature separada (gera registros em financeiro) — aqui só até
-- 'concluida'. 'faturada' já existe no check pra não exigir migration nova
-- quando a feature de Faturamento chegar.
-- =============================================================================

create table if not exists ordens_servico (
  id                uuid primary key default gen_random_uuid(),
  numero            bigserial not null unique, -- número amigável (ex.: OS #42)

  cliente_id        uuid not null references clientes(id),
  veiculo_id        uuid not null references veiculos(id),

  status            text not null default 'aberta'
                       check (status in ('aberta', 'em_andamento', 'concluida', 'faturada')),

  descricao_problema text,
  observacoes        text,

  data_abertura     timestamptz not null default now(),
  data_conclusao    timestamptz,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_os_cliente on ordens_servico (cliente_id);
create index if not exists idx_os_veiculo on ordens_servico (veiculo_id);
create index if not exists idx_os_status  on ordens_servico (status);

drop trigger if exists trg_os_updated on ordens_servico;
create trigger trg_os_updated
  before update on ordens_servico
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- ITENS DA OS (peça ou serviço)
-- ---------------------------------------------------------------------------
-- Item de peça: peca_id + movimentacao_id (a baixa de estoque correspondente,
-- feita pela aplicação em estoque.movimentacao_estoque — ver itens.service.ts).
-- descricao e valor_unit são SNAPSHOT do momento em que o item foi adicionado
-- (o preço da peça pode mudar depois; a OS não deve mudar retroativamente).
-- Item removido não é apagado (removido=true) pra manter o histórico da OS.
create table if not exists os_itens (
  id              uuid primary key default gen_random_uuid(),
  os_id           uuid not null references ordens_servico(id) on delete cascade,
  tipo            text not null check (tipo in ('peca', 'servico')),

  peca_id         uuid references pecas(id),
  movimentacao_id uuid references movimentacao_estoque(id),

  descricao       text not null,
  quantidade      integer not null default 1 check (quantidade > 0),
  valor_unit      numeric(10,2) not null default 0,

  removido        boolean not null default false,
  motivo_remocao  text,

  created_at      timestamptz not null default now(),

  check (
    (tipo = 'peca' and peca_id is not null) or
    (tipo = 'servico' and peca_id is null and movimentacao_id is null)
  )
);

create index if not exists idx_os_itens_os on os_itens (os_id);

-- =============================================================================
-- NOTA: remover um item de peça não apaga a linha nem a movimentação de saída
-- já registrada — a aplicação lança uma movimentação de AJUSTE (+quantidade)
-- pra devolver o estoque, e marca o item como removido=true (ver
-- itens.service.ts). O razão de estoque continua append-only.
-- =============================================================================
