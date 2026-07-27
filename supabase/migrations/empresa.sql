-- =============================================================================
-- CONFIGURAÇÃO DA EMPRESA (singleton)
-- =============================================================================
-- Uma linha só. `regime` é o interruptor MEI ↔ ME (ver CLAUDE.md) — a
-- aplicação sempre lê/atualiza a primeira linha; se não existir nenhuma,
-- pede pra configurar (ver DashboardPage).
-- =============================================================================

create table if not exists empresa_config (
  id                uuid primary key default gen_random_uuid(),
  regime            text not null default 'MEI' check (regime in ('MEI', 'ME_SIMPLES')),
  limite_anual_mei  numeric(10,2) not null default 81000, -- ajustável se a lei mudar
  nome_fantasia     text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists trg_empresa_config_updated on empresa_config;
create trigger trg_empresa_config_updated
  before update on empresa_config
  for each row execute function set_updated_at();
