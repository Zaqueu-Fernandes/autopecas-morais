-- =============================================================================
-- RLS — cobre categorias_despesa e nfe_importadas (faltaram na lista original)
-- =============================================================================
-- rls_policies.sql já resolveu isso pras tabelas que existiam na época, mas
-- categorias_despesa (feature categorias) e nfe_importadas (feature
-- importacao-nfe) foram criadas DEPOIS e nunca entraram na lista — ficaram
-- com RLS ligada e nenhuma policy, ou seja, bloqueadas pra leitura E escrita
-- do anon (confirmado: INSERT/SELECT direto na API retornam erro 42501 /
-- lista vazia). Mesma política provisória das demais — ver rls_policies.sql
-- pra contexto completo (é provisório, revisar quando existir Supabase Auth).
-- =============================================================================

do $$
declare
  tabela text;
begin
  foreach tabela in array array['categorias_despesa', 'nfe_importadas']
  loop
    if to_regclass('public.' || tabela) is null then
      raise notice 'Tabela % ainda não existe — pulando (rode a migration dela antes).', tabela;
      continue;
    end if;

    execute format('alter table %I enable row level security;', tabela);
    execute format('drop policy if exists "acesso_total_provisorio" on %I;', tabela);
    execute format(
      'create policy "acesso_total_provisorio" on %I for all to anon, authenticated using (true) with check (true);',
      tabela
    );
  end loop;
end $$;
