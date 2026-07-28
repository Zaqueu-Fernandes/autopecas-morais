-- =============================================================================
-- ESTORNO DE LANÇAMENTO FINANCEIRO
-- =============================================================================
-- Correção de um lançamento já quitado (ou vinculado a OS/venda) nunca é por
-- exclusão — isso apagaria rastro contábil e podia desincronizar estoque/OS
-- sem ninguém perceber (foi exatamente o problema resolvido manualmente numa
-- limpeza de dados de teste). O jeito certo é ESTORNAR: o lançamento original
-- fica marcado (estornado=true), preservado; se ele já tinha sido pago/
-- recebido, gera-se um lançamento de CONTRAPARTIDA (tipo invertido, mesmo
-- valor, categoria 'estorno') representando o dinheiro saindo/voltando de
-- verdade — é assim que serve tanto pra "corrigi um lançamento errado" quanto
-- pra devolução/reembolso de cliente no futuro (peça devolvida ainda vai
-- precisar de uma ENTRADA de estoque separada, isso aqui é só o lado
-- financeiro). Lançamento PENDENTE e sem vínculo de OS/venda continua podendo
-- ser excluído de verdade (ver excluirLancamento em financeiro.service.ts) —
-- não tem cascata, não tem rastro de dinheiro real pra preservar.
-- =============================================================================

alter table financeiro
  add column if not exists estornado boolean not null default false,
  add column if not exists estornado_em timestamptz,
  add column if not exists estornado_motivo text,
  add column if not exists estorno_de_id uuid references financeiro(id);

create index if not exists idx_financeiro_estorno_de on financeiro (estorno_de_id);

-- 'estorno' categoria protegida — usada nos lançamentos de contrapartida.
insert into categorias_despesa (chave, nome, protegida) values
  ('estorno', 'Estorno / Reembolso', true)
on conflict (chave) do nothing;

-- Categoria de RECEBER precisa admitir 'estorno' também (contrapartida de um
-- 'pagar' estornado é um 'receber' — dinheiro voltando pro caixa).
do $$
declare
  nome_constraint text;
begin
  select conname into nome_constraint
    from pg_constraint
   where conrelid = 'financeiro'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) like '%categoria%';
  if nome_constraint is not null then
    execute format('alter table financeiro drop constraint %I', nome_constraint);
  end if;
end $$;

alter table financeiro
  add constraint financeiro_check
  check (
    (tipo = 'pagar'   and categoria is not null and categoria <> '') or
    (tipo = 'receber' and categoria in ('servico_os', 'venda_balcao', 'estorno'))
  );
