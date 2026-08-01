-- ============================================================================
-- OCULTAR LANÇAMENTO DE ENTRADA EM DINHEIRO — POR USUÁRIO
-- ============================================================================
-- O admin escolhe, lançamento a lançamento (só tipo='receber' com
-- forma_pagamento='dinheiro'), PRA QUAIS usuários aquele lançamento deve
-- sumir — de listas, somatórios (Dashboard, Fluxo de Caixa) e relatórios
-- impressos/PDF, como se não existisse. A regra é POR USUÁRIO, não global:
-- o mesmo lançamento pode estar oculto pra um operador e visível pra outro,
-- e o admin pode inclusive incluir a si mesmo na lista de quem não vê.
-- Só admin gerencia (decide quem oculta o quê) — não é uma permissão
-- delegável como as de permissoes_usuario.sql, é sempre is_admin().

create table if not exists financeiro_ocultacoes (
  financeiro_id uuid not null references financeiro(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  criado_por uuid references auth.users(id),
  primary key (financeiro_id, usuario_id)
);

create index if not exists idx_financeiro_ocultacoes_usuario on financeiro_ocultacoes (usuario_id);

alter table financeiro_ocultacoes enable row level security;

-- Select: cada usuário vê quais lançamentos estão ocultos PRA ELE (é assim
-- que o Dashboard/Fluxo de Caixa/Financeiro filtram os PRÓPRIOS totais e
-- listas); admin vê tudo (pra gerenciar quem oculta o quê, na tela de
-- Financeiro).
drop policy if exists "ocultacoes_select" on financeiro_ocultacoes;
create policy "ocultacoes_select" on financeiro_ocultacoes for select to authenticated
  using (usuario_id = auth.uid() or is_admin());

-- Escrita: só admin decide quem oculta o quê.
drop policy if exists "ocultacoes_admin_escreve" on financeiro_ocultacoes;
create policy "ocultacoes_admin_escreve" on financeiro_ocultacoes for all to authenticated
  using (is_admin())
  with check (is_admin());
