-- =============================================================================
-- Migration: {{DESCRIPTION}}
-- Arquivo: supabase/migrations/{{YYYYMMDDHHMMSS}}_{{description_snake_case}}.sql
-- Autor: {{AUTHOR}}
-- Data: {{DATE}}
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Criar tabela
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS {{TABLE}} (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Campos de negocio
  name        TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),

  -- Foreign keys
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- org_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Timestamps padrao
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Comentario na tabela (documentacao inline)
COMMENT ON TABLE {{TABLE}} IS '{{DESCRIPTION}}';

-- -----------------------------------------------------------------------------
-- 2. Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE {{TABLE}} ENABLE ROW LEVEL SECURITY;

-- SELECT: usuario ve seus proprios registros
CREATE POLICY "Users can view own {{TABLE}}"
  ON {{TABLE}} FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: usuario cria com seu proprio user_id
CREATE POLICY "Users can create own {{TABLE}}"
  ON {{TABLE}} FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: usuario atualiza seus proprios registros
CREATE POLICY "Users can update own {{TABLE}}"
  ON {{TABLE}} FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: usuario deleta seus proprios registros
CREATE POLICY "Users can delete own {{TABLE}}"
  ON {{TABLE}} FOR DELETE
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 3. Indices
-- -----------------------------------------------------------------------------

-- Indice para RLS policy (OBRIGATORIO quando policy usa coluna em USING)
CREATE INDEX idx_{{TABLE}}_user_id ON {{TABLE}}(user_id);

-- Indice para queries comuns
CREATE INDEX idx_{{TABLE}}_status ON {{TABLE}}(status);
CREATE INDEX idx_{{TABLE}}_created_at ON {{TABLE}}(created_at DESC);

-- Indice composto (se queries filtram por ambos)
-- CREATE INDEX idx_{{TABLE}}_user_status ON {{TABLE}}(user_id, status);

-- -----------------------------------------------------------------------------
-- 4. Trigger de updated_at
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar apenas se trigger nao existe (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_{{TABLE}}'
  ) THEN
    CREATE TRIGGER set_updated_at_{{TABLE}}
      BEFORE UPDATE ON {{TABLE}}
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. Audit trail (opcional — descomentar se necessario)
-- -----------------------------------------------------------------------------

-- CREATE TRIGGER audit_{{TABLE}}_trigger
--   AFTER INSERT OR UPDATE OR DELETE ON {{TABLE}}
--   FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- -----------------------------------------------------------------------------
-- 6. Seed data (opcional — apenas para tabelas de referencia)
-- -----------------------------------------------------------------------------

-- INSERT INTO {{TABLE}} (name, user_id) VALUES
--   ('Exemplo 1', '00000000-0000-0000-0000-000000000000'),
--   ('Exemplo 2', '00000000-0000-0000-0000-000000000000')
-- ON CONFLICT DO NOTHING;

COMMIT;

-- =============================================================================
-- ROLLBACK (criar em migration separada: {{YYYYMMDDHHMMSS}}_revert_{{description}}.sql)
-- =============================================================================
-- BEGIN;
-- DROP TRIGGER IF EXISTS set_updated_at_{{TABLE}} ON {{TABLE}};
-- DROP TRIGGER IF EXISTS audit_{{TABLE}}_trigger ON {{TABLE}};
-- DROP POLICY IF EXISTS "Users can view own {{TABLE}}" ON {{TABLE}};
-- DROP POLICY IF EXISTS "Users can create own {{TABLE}}" ON {{TABLE}};
-- DROP POLICY IF EXISTS "Users can update own {{TABLE}}" ON {{TABLE}};
-- DROP POLICY IF EXISTS "Users can delete own {{TABLE}}" ON {{TABLE}};
-- DROP INDEX IF EXISTS idx_{{TABLE}}_user_id;
-- DROP INDEX IF EXISTS idx_{{TABLE}}_status;
-- DROP INDEX IF EXISTS idx_{{TABLE}}_created_at;
-- DROP TABLE IF EXISTS {{TABLE}};
-- COMMIT;
