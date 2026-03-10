-- =============================================================================
-- RLS Policy Templates
-- Patterns comuns para Row Level Security no Supabase/PostgreSQL
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Pattern 1: Owner-Only
-- Usuario so acessa seus proprios registros
-- Requer: coluna `user_id UUID REFERENCES auth.users(id)` na tabela
-- Indice: CREATE INDEX idx_{{TABLE}}_user_id ON {{TABLE}}(user_id);
-- -----------------------------------------------------------------------------

ALTER TABLE {{TABLE}} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own records"
  ON {{TABLE}} FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own records"
  ON {{TABLE}} FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own records"
  ON {{TABLE}} FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own records"
  ON {{TABLE}} FOR DELETE
  USING (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- Pattern 2: Org-Scoped
-- Usuario acessa registros da sua organizacao
-- Requer: tabela `org_members(org_id, user_id)` com indice em ambas colunas
-- Performance: usar security definer function para evitar nested RLS
-- -----------------------------------------------------------------------------

-- Helper function (evita subquery repetido + nested RLS)
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT org_id FROM org_members WHERE user_id = auth.uid()
$$;

ALTER TABLE {{TABLE}} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view records"
  ON {{TABLE}} FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Org members can insert records"
  ON {{TABLE}} FOR INSERT
  WITH CHECK (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Org members can update records"
  ON {{TABLE}} FOR UPDATE
  USING (org_id IN (SELECT get_user_org_ids()))
  WITH CHECK (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Org members can delete records"
  ON {{TABLE}} FOR DELETE
  USING (org_id IN (SELECT get_user_org_ids()));


-- -----------------------------------------------------------------------------
-- Pattern 3: Public Read, Authenticated Write
-- Qualquer pessoa pode ler, apenas autenticados podem escrever (seus proprios)
-- Ideal para: blog posts, conteudo publico, catalogo de produtos
-- -----------------------------------------------------------------------------

ALTER TABLE {{TABLE}} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view records"
  ON {{TABLE}} FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert"
  ON {{TABLE}} FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Owners can update their records"
  ON {{TABLE}} FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners can delete their records"
  ON {{TABLE}} FOR DELETE
  USING (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- Pattern 4: Admin Bypass
-- Admins acessam tudo, usuarios normais so seus registros
-- Requer: coluna `role` na tabela de profiles ou claims do JWT
-- Performance: check admin primeiro (short-circuit)
-- -----------------------------------------------------------------------------

-- Helper function para verificar admin (evita query repetida)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin')
  )
$$;

ALTER TABLE {{TABLE}} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do anything"
  ON {{TABLE}} FOR ALL
  USING (is_admin());

CREATE POLICY "Users can view own records"
  ON {{TABLE}} FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own records"
  ON {{TABLE}} FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own records"
  ON {{TABLE}} FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own records"
  ON {{TABLE}} FOR DELETE
  USING (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- Lembretes Importantes
-- -----------------------------------------------------------------------------
-- 1. SEMPRE separar policies por operacao (SELECT/INSERT/UPDATE/DELETE)
-- 2. INSERT usa WITH CHECK (nao USING) — USING em INSERT e ignorado
-- 3. UPDATE precisa USING (quais linhas ve) + WITH CHECK (resultado valido)
-- 4. Criar indice em TODA coluna referenciada em policies
-- 5. USING(false) bloqueia tudo — cuidado ao testar
-- 6. Testar com SET ROLE authenticated antes de deploy
-- 7. service_role bypassa RLS — NUNCA expor no client
