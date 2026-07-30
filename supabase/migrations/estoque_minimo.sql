-- ============================================================================
-- ESTOQUE MÍNIMO
-- ============================================================================
-- Cada peça pode ter um limite mínimo de estoque configurado. 0 = monitora-
-- mento desligado pra essa peça (não aparece no semáforo da tela de Estoque
-- nem no alerta do Dashboard). Quando qtd <= estoque_minimo (e estoque_minimo
-- > 0), a peça entra no card "Itens com estoque mínimo" do Dashboard.

alter table pecas add column if not exists estoque_minimo integer not null default 0;
