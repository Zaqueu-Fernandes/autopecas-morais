-- =============================================================================
-- FINANCEIRO
-- =============================================================================
-- Tabela única pra pagar e receber, com um campo `tipo` como discriminador.
-- `pago` significa "quitado": recebido (tipo=receber) ou pago (tipo=pagar).
--
-- Recebimento de OS (3 situações, ver CLAUDE.md):
--   1. À vista:    pago=true,  forma_pagamento preenchida, data_pagamento=hoje
--   2. A prazo:    pago=false, vencimento=data
--   3. Em aberto:  pago=false, vencimento=NULL, cliente_id amarrado (fiado)
--
-- REGRA DE OURO: categoria 'retirada_lucro' NUNCA entra no cálculo de lucro
-- (é destino do lucro, não custo) — isso é responsabilidade de quem calcular
-- lucro/dashboard depois, não desta tabela.
-- =============================================================================

create table if not exists financeiro (
  id              uuid primary key default gen_random_uuid(),
  tipo            text not null check (tipo in ('pagar', 'receber')),
  categoria       text not null,

  descricao       text not null,
  valor           numeric(10,2) not null check (valor > 0),

  pago            boolean not null default false,
  forma_pagamento text,   -- dinheiro | pix | cartao_debito | cartao_credito | boleto | transferencia
  data_pagamento  timestamptz,
  vencimento      date,   -- NULL = em aberto (só faz sentido com pago=false)

  cliente_id      uuid references clientes(id),      -- receber amarrado a cliente (a_prazo/fiado)
  fornecedor_id   uuid references fornecedores(id),  -- pagar categoria='fornecedor'
  os_id           uuid references ordens_servico(id), -- origem: faturamento de uma OS

  observacoes     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  check (
    (tipo = 'pagar'   and categoria in ('fornecedor', 'despesa_fixa', 'despesa_variavel', 'imposto', 'folha', 'retirada_lucro')) or
    (tipo = 'receber' and categoria in ('servico_os', 'venda_balcao'))
  )
);

create index if not exists idx_financeiro_tipo      on financeiro (tipo);
create index if not exists idx_financeiro_pago       on financeiro (pago);
create index if not exists idx_financeiro_cliente    on financeiro (cliente_id);
create index if not exists idx_financeiro_fornecedor on financeiro (fornecedor_id);
create index if not exists idx_financeiro_os         on financeiro (os_id);

drop trigger if exists trg_financeiro_updated on financeiro;
create trigger trg_financeiro_updated
  before update on financeiro
  for each row execute function set_updated_at();
