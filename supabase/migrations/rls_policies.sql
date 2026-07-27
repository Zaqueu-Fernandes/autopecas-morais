-- =============================================================================
-- RLS (Row Level Security) — política provisória de acesso total
-- =============================================================================
-- O app ainda não tem login (usa só a anon key direto, "usuário único" —
-- ver CLAUDE.md). O Supabase habilita RLS por padrão nas tabelas novas; sem
-- nenhuma policy, TODO insert/update fica bloqueado (foi o bug que travou
-- o salvamento em todas as telas).
--
-- Solução PROVISÓRIA: libera tudo pra anon/authenticated. Isso significa que
-- qualquer pessoa com a URL + anon key do projeto (que já ficam expostas no
-- bundle público, é assim que o Supabase funciona) consegue ler e escrever
-- em qualquer tabela. Aceitável para uso interno de um único dono de oficina
-- testando o sistema — REVISAR antes de divulgar o link amplamente ou
-- adicionar dados sensíveis de terceiros. Quando o app ganhar login (Supabase
-- Auth), trocar essas policies por regras baseadas em auth.uid().
-- =============================================================================

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
    'empresa_config'
  ]
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
