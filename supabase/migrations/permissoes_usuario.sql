-- ============================================================================
-- PERMISSÕES GRANULARES POR USUÁRIO
-- ============================================================================
-- Admin/operador (auth_perfis_rls.sql) continua sendo o papel binário
-- básico. Esta migration adiciona 6 permissões finas, configuráveis POR
-- OPERADOR individual numa tela nova (só admin acessa) — hoje essas 6 ações
-- são: 3 abertas pra qualquer usuário logado (Devolver de OS/Venda,
-- Estornar, Desativar despesa recorrente), 1 já admin-only (Ajustar estoque)
-- e 1 sem trava nenhuma (Devolver ao Fornecedor). Admin SEMPRE tem acesso
-- total às 6 (tem_permissao() já embute is_admin()) — a tela nova só
-- configura operadores, nunca lista/restringe admin.
--
-- Também corrige um acoplamento acidental: "Devolver" (OS/Venda), quando o
-- item é peça, reaproveitava registrarAjuste() com origem='ajuste_manual' —
-- a MESMA origem que a policy de movimentacao_estoque já travava só pra
-- admin (ver seção 6 de auth_perfis_rls.sql). Ou seja, "Devolver" já estava
-- de fato preso à trava de "Ajustar", sem ninguém ter pedido isso e sem UI
-- avisando. Damos origem própria pra devolução (devolucao_item_os /
-- devolucao_item_venda) e remoção pré-fatura (remocao_item, sem trava —
-- só destrava do lock acidental), pra "Devolver" virar uma permissão
-- independente de "Ajustar" de verdade. Ver itens.service.ts (ordens-servico
-- e vendas) e movimentacao.service.ts (registrarAjuste ganhou parâmetro
-- `origem` opcional).

-- 1) Tabela ------------------------------------------------------------------
create table if not exists permissoes_usuario (
  usuario_id uuid not null references perfis(id) on delete cascade,
  chave text not null check (chave in (
    'devolver_os_item', 'devolver_venda_item', 'estornar_financeiro',
    'desativar_despesa_recorrente', 'ajustar_estoque', 'devolver_fornecedor'
  )),
  permitido boolean not null default false,
  primary key (usuario_id, chave)
);

-- Seed pra todo perfil já existente: as 5 ações que HOJE são abertas nascem
-- permitido=true (não quebra ninguém no dia do deploy); só ajustar_estoque
-- nasce false (mantém o comportamento admin-only atual).
insert into permissoes_usuario (usuario_id, chave, permitido)
select p.id, chave, (chave <> 'ajustar_estoque')
from perfis p, unnest(array[
  'devolver_os_item', 'devolver_venda_item', 'estornar_financeiro',
  'desativar_despesa_recorrente', 'ajustar_estoque', 'devolver_fornecedor'
]) as chave
on conflict do nothing;

-- 2) Helper pra RLS: usuário logado tem essa permissão? (admin sempre tem) --
create or replace function public.tem_permissao(chave_permissao text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select is_admin() or exists (
    select 1 from permissoes_usuario
    where usuario_id = auth.uid() and chave = chave_permissao and permitido = true
  );
$$;

-- 3) Novo usuário nasce com as mesmas 6 linhas default (senão nasce sem
--    nenhuma das 5 que deveriam vir abertas) — reescreve o trigger de
--    auth_perfis_rls.sql acrescentando esse insert.
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

  insert into public.permissoes_usuario (usuario_id, chave, permitido)
  select new.id, chave, (chave <> 'ajustar_estoque')
  from unnest(array[
    'devolver_os_item', 'devolver_venda_item', 'estornar_financeiro',
    'desativar_despesa_recorrente', 'ajustar_estoque', 'devolver_fornecedor'
  ]) as chave
  on conflict do nothing;

  return new;
end;
$$;

-- 4) RLS de permissoes_usuario -----------------------------------------------
-- Select: cada um vê a própria linha; admin vê de todo mundo (tela admin).
-- Escrita: só admin (nunca o próprio operador se autoconcede permissão).
alter table permissoes_usuario enable row level security;

drop policy if exists "permissoes_select" on permissoes_usuario;
create policy "permissoes_select" on permissoes_usuario for select to authenticated
  using (usuario_id = auth.uid() or is_admin());

drop policy if exists "permissoes_admin_escreve" on permissoes_usuario;
create policy "permissoes_admin_escreve" on permissoes_usuario for all to authenticated
  using (is_admin())
  with check (is_admin());

-- 5) movimentacao_estoque: generaliza a trava única (só 'ajuste_manual') pra
--    5 origens independentes. Cada cláusula usa IS DISTINCT FROM (NULL-safe:
--    origem pode ser null em entrada/saída) e só restringe a PRÓPRIA origem —
--    é assim que o WITH CHECK combinado já funcionava pro caso único de
--    'ajuste_manual', só generalizado pras novas origens.
drop policy if exists "acesso_logados" on movimentacao_estoque;
create policy "acesso_logados" on movimentacao_estoque for all to authenticated
  using (true)
  with check (
    (origem is distinct from 'ajuste_manual' or tem_permissao('ajustar_estoque'))
    and (origem is distinct from 'devolucao_fornecedor_defeito' or tem_permissao('devolver_fornecedor'))
    and (origem is distinct from 'devolucao_fornecedor_nfe_cancelada' or tem_permissao('devolver_fornecedor'))
    and (origem is distinct from 'devolucao_item_os' or tem_permissao('devolver_os_item'))
    and (origem is distinct from 'devolucao_item_venda' or tem_permissao('devolver_venda_item'))
  );

-- 6) os_itens / venda_itens: trava a MARCA de devolução (motivo_remocao
--    prefixado "Devolução:") — cobre também item tipo serviço, que não
--    passa por movimentacao_estoque. motivo_remocao is null cobre o INSERT
--    normal do item (sem isso, toda linha nova seria rejeitada: NULL LIKE
--    qualquer coisa é NULL, e WITH CHECK trata NULL como reprovado).
drop policy if exists "acesso_logados" on os_itens;
create policy "acesso_logados" on os_itens for all to authenticated
  using (true)
  with check (
    motivo_remocao is null
    or motivo_remocao not like 'Devolução:%'
    or tem_permissao('devolver_os_item')
  );

drop policy if exists "acesso_logados" on venda_itens;
create policy "acesso_logados" on venda_itens for all to authenticated
  using (true)
  with check (
    motivo_remocao is null
    or motivo_remocao not like 'Devolução:%'
    or tem_permissao('devolver_venda_item')
  );

-- 7) despesas_fixas: só quem tem a permissão pode DESATIVAR (ativo -> false).
--    Criar/editar/reativar continuam abertos — IS DISTINCT FROM é NULL-safe.
drop policy if exists "acesso_logados" on despesas_fixas;
create policy "acesso_logados" on despesas_fixas for all to authenticated
  using (true)
  with check (ativo is distinct from false or tem_permissao('desativar_despesa_recorrente'));

-- 8) financeiro: só quem tem a permissão pode marcar estornado=true, ou
--    inserir um lançamento categoria='estorno' (usado tanto pelo estorno de
--    lançamento inteiro quanto pelo reembolso de devolução de item — QUALQUER
--    uma das 3 permissões abaixo já cobre esse insert, porque as duas
--    devoluções também geram lançamento 'estorno' quando o original já
--    estava pago).
drop policy if exists "acesso_logados" on financeiro;
create policy "acesso_logados" on financeiro for all to authenticated
  using (true)
  with check (
    (estornado is distinct from true or tem_permissao('estornar_financeiro'))
    and (
      categoria is distinct from 'estorno'
      or tem_permissao('estornar_financeiro')
      or tem_permissao('devolver_os_item')
      or tem_permissao('devolver_venda_item')
    )
  );
