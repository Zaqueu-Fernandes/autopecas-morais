-- =============================================================================
-- CONFIGURAÇÕES DO SISTEMA (chave/valor genérico, admin-only pra escrever)
-- =============================================================================
-- Tabela genérica pra guardar ajustes globais que o admin pode trocar sem
-- precisar de deploy novo. Primeiro uso: a URL do serviço externo de consulta
-- de NF-e por chave de acesso, usada pelo botão "Baixar XML de Nota Fiscal"
-- em Estoque (o admin cadastra em Admin > URL para baixar XML — ver
-- ConfiguracoesPage.tsx) — mas serve pra qualquer configuração futura do tipo
-- "um valor só, editável pelo admin, lido por todo mundo".
-- =============================================================================

create table if not exists configuracoes_sistema (
  chave       text primary key,
  valor       text,
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_configuracoes_sistema_updated on configuracoes_sistema;
create trigger trg_configuracoes_sistema_updated
  before update on configuracoes_sistema
  for each row execute function set_updated_at();

alter table configuracoes_sistema enable row level security;

-- Select: qualquer usuário logado pode ler (o botão em Estoque precisa da
-- URL pra qualquer um que usa o sistema, não só admin).
drop policy if exists "config_select" on configuracoes_sistema;
create policy "config_select" on configuracoes_sistema for select to authenticated
  using (true);

-- Escrita: só admin decide as configurações do sistema.
drop policy if exists "config_admin_escreve" on configuracoes_sistema;
create policy "config_admin_escreve" on configuracoes_sistema for all to authenticated
  using (is_admin())
  with check (is_admin());
