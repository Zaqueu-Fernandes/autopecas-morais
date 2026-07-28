-- ============================================================================
-- AUTENTICAÇÃO + PERFIS (admin / operador) + RLS DE VERDADE
-- ============================================================================
-- Substitui a política "acesso_total_provisorio" (aberta pra anon+authenticated,
-- documentada como provisória em CLAUDE.md) por acesso restrito a usuários
-- logados (authenticated), com uma trava extra de admin só pro ajuste manual
-- de estoque.

-- 1) Tabela de perfis (1 linha por usuário do Supabase Auth) ----------------
create table if not exists perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  papel text not null default 'operador' check (papel in ('admin', 'operador')),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2) Ao criar um usuário no Supabase Auth, cria o perfil automaticamente ----
-- Sempre nasce 'operador' por segurança — promover a admin é manual (SQL),
-- nunca automático.
create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome, papel)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), 'operador')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();

-- 3) Helper pra RLS: usuário logado é admin ativo? ---------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from perfis
    where id = auth.uid() and papel = 'admin' and ativo = true
  );
$$;

-- 4) perfis: cada usuário vê/edita o próprio perfil; admin vê/edita todos ---
alter table perfis enable row level security;

drop policy if exists "perfis_select" on perfis;
create policy "perfis_select" on perfis for select to authenticated
  using (id = auth.uid() or is_admin());

drop policy if exists "perfis_update" on perfis;
create policy "perfis_update" on perfis for update to authenticated
  using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

-- 5) RLS geral: troca "acesso_total_provisorio" (anon+authenticated) por
--    acesso só pra authenticated, em todas as tabelas do app -----------------
do $$
declare
  tabela text;
begin
  foreach tabela in array array[
    'clientes', 'fornecedores', 'veiculos',
    'pecas', 'movimentacao_estoque',
    'ordens_servico', 'os_itens',
    'financeiro',
    'vendas_balcao', 'venda_itens',
    'despesas_fixas',
    'empresa_config',
    'categorias_despesa', 'nfe_importadas'
  ]
  loop
    if to_regclass('public.' || tabela) is null then
      raise notice 'Tabela % ainda não existe — pulando.', tabela;
      continue;
    end if;

    execute format('drop policy if exists "acesso_total_provisorio" on %I;', tabela);
    execute format('drop policy if exists "acesso_logados" on %I;', tabela);
    execute format(
      'create policy "acesso_logados" on %I for all to authenticated using (true) with check (true);',
      tabela
    );
  end loop;
end $$;

-- 6) Trava extra: ajuste manual de estoque só por admin ----------------------
-- movimentacao_estoque continua liberada pra authenticated em geral (entrada,
-- saída por uso em OS/venda, devolução ao fornecedor), MAS origem =
-- 'ajuste_manual' exige is_admin(). Uma única policy com WITH CHECK
-- combinado — policies permissivas do Postgres se somam com OR, então duas
-- policies separadas ("geral" + "admin") NÃO restringiriam nada.
drop policy if exists "acesso_logados" on movimentacao_estoque;
create policy "acesso_logados" on movimentacao_estoque for all to authenticated
  using (true)
  with check (origem is distinct from 'ajuste_manual' or is_admin());
