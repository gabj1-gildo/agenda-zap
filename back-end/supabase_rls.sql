-- =============================================================================
-- AgendaZap - PolÃ­ticas de Row Level Security (RLS) para o Supabase
-- =============================================================================
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/drxbmlbaxtebdonwhuvn/sql/new
--
-- ESTRATÃ‰GIA:
--   O backend usa JWT prÃ³prio (nÃ£o Supabase Auth). Para que o RLS funcione,
--   o backend define a variÃ¡vel de sessÃ£o PostgreSQL:
--     SET LOCAL app.current_tenant_id = '<uuid-do-tenant>';
--   antes de cada query dentro de uma transaÃ§Ã£o.
--
--   As polÃ­ticas RLS leem essa variÃ¡vel via current_setting().
-- =============================================================================

-- FunÃ§Ã£o auxiliar: lÃª o tenant_id da variÃ¡vel de sessÃ£o PostgreSQL
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
$$;

-- =============================================================================
-- TABELA: tenants
-- =============================================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Cada tenant vÃª apenas seu prÃ³prio registro
CREATE POLICY "tenants_select_own" ON tenants
  FOR SELECT
  USING (id = current_tenant_id());

-- Cada tenant atualiza apenas seus prÃ³prios dados
CREATE POLICY "tenants_update_own" ON tenants
  FOR UPDATE
  USING (id = current_tenant_id());

-- InserÃ§Ã£o e deleÃ§Ã£o sÃ£o feitas apenas pelo service role (sem policy = bloqueado)

-- =============================================================================
-- TABELA: users_admin
-- =============================================================================
ALTER TABLE users_admin ENABLE ROW LEVEL SECURITY;

-- Admin vÃª apenas usuÃ¡rios do seu tenant (ou todos, se for SUPERADMIN sem tenant)
CREATE POLICY "users_admin_select" ON users_admin
  FOR SELECT
  USING (
    tenant_id = current_tenant_id()
    OR (tenant_id IS NULL AND current_tenant_id() IS NULL)
  );

CREATE POLICY "users_admin_update" ON users_admin
  FOR UPDATE
  USING (
    tenant_id = current_tenant_id()
    OR (tenant_id IS NULL AND current_tenant_id() IS NULL)
  );

-- =============================================================================
-- TABELA: clients
-- Clients sÃ£o compartilhados (sem tenant_id direto).
-- O acesso Ã© controlado atravÃ©s das tabelas que fazem referÃªncia (appointments, chat_sessions).
-- Para SELECT direto de clients, usa-se policy via EXISTS em appointments.
-- =============================================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Um tenant pode ver clientes que tÃªm agendamentos ou sessÃµes vinculadas a ele
CREATE POLICY "clients_select_via_tenant" ON clients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.client_id = clients.id
        AND a.tenant_id = current_tenant_id()
    )
    OR EXISTS (
      SELECT 1 FROM chat_sessions cs
      WHERE cs.client_id = clients.id
        AND cs.tenant_id = current_tenant_id()
    )
  );

-- Um tenant pode inserir/atualizar clientes (para novos clientes via WhatsApp)
CREATE POLICY "clients_insert" ON clients
  FOR INSERT
  WITH CHECK (true); -- Qualquer tenant autenticado pode criar clientes

CREATE POLICY "clients_update" ON clients
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.client_id = clients.id
        AND a.tenant_id = current_tenant_id()
    )
    OR EXISTS (
      SELECT 1 FROM chat_sessions cs
      WHERE cs.client_id = clients.id
        AND cs.tenant_id = current_tenant_id()
    )
  );

-- =============================================================================
-- TABELA: appointments
-- =============================================================================
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_select" ON appointments
  FOR SELECT
  USING (tenant_id = current_tenant_id());

CREATE POLICY "appointments_insert" ON appointments
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "appointments_update" ON appointments
  FOR UPDATE
  USING (tenant_id = current_tenant_id());

CREATE POLICY "appointments_delete" ON appointments
  FOR DELETE
  USING (tenant_id = current_tenant_id());

-- =============================================================================
-- TABELA: schedules
-- =============================================================================
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedules_select" ON schedules
  FOR SELECT
  USING (tenant_id = current_tenant_id());

CREATE POLICY "schedules_insert" ON schedules
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "schedules_update" ON schedules
  FOR UPDATE
  USING (tenant_id = current_tenant_id());

CREATE POLICY "schedules_delete" ON schedules
  FOR DELETE
  USING (tenant_id = current_tenant_id());

-- =============================================================================
-- TABELA: chat_sessions
-- =============================================================================
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_sessions_select" ON chat_sessions
  FOR SELECT
  USING (tenant_id = current_tenant_id());

CREATE POLICY "chat_sessions_insert" ON chat_sessions
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "chat_sessions_update" ON chat_sessions
  FOR UPDATE
  USING (tenant_id = current_tenant_id());

CREATE POLICY "chat_sessions_delete" ON chat_sessions
  FOR DELETE
  USING (tenant_id = current_tenant_id());

-- =============================================================================
-- TABELA: token_logs
-- =============================================================================
ALTER TABLE token_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "token_logs_select" ON token_logs
  FOR SELECT
  USING (tenant_id = current_tenant_id());

CREATE POLICY "token_logs_insert" ON token_logs
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id());

-- token_logs sÃ£o imutÃ¡veis (sem update/delete policies)

-- =============================================================================
-- TABELA: billing
-- =============================================================================
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "billing_select" ON billing
  FOR SELECT
  USING (tenant_id = current_tenant_id());

-- billing Ã© gerenciado pelo sistema, nÃ£o pelo tenant (sem insert/update/delete)

-- =============================================================================
-- TABELA: payment_keys
-- =============================================================================
ALTER TABLE payment_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_keys_select" ON payment_keys
  FOR SELECT
  USING (tenant_id = current_tenant_id());

CREATE POLICY "payment_keys_insert" ON payment_keys
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "payment_keys_update" ON payment_keys
  FOR UPDATE
  USING (tenant_id = current_tenant_id());

CREATE POLICY "payment_keys_delete" ON payment_keys
  FOR DELETE
  USING (tenant_id = current_tenant_id());

-- =============================================================================
-- VERIFICAÃ‡ÃƒO FINAL
-- Listar todas as polÃ­ticas criadas
-- =============================================================================
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
