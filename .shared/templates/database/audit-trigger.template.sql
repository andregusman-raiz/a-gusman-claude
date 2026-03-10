-- =============================================================================
-- Audit Trail Trigger Template
-- Registra todas as mudancas em tabela audit_logs com JSONB
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Criar tabela audit_logs (se nao existe)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name    TEXT NOT NULL,
  record_id     TEXT NOT NULL,
  operation     TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data      JSONB,
  new_data      JSONB,
  changed_fields TEXT[],
  user_id       UUID REFERENCES auth.users(id),
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indices para queries comuns
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON audit_logs(operation);

-- RLS: apenas admins podem ler audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Ninguem pode modificar audit logs via API (apenas trigger)
-- INSERT permitido apenas via trigger (sem policy = bloqueado para usuarios)

-- -----------------------------------------------------------------------------
-- 2. Funcao de audit genérica
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  record_id_value TEXT;
  changed TEXT[];
  col TEXT;
BEGIN
  -- Extrair ID do registro (suporta 'id' UUID ou TEXT)
  IF TG_OP = 'DELETE' THEN
    record_id_value := OLD.id::TEXT;
  ELSE
    record_id_value := NEW.id::TEXT;
  END IF;

  -- Calcular campos alterados (apenas para UPDATE)
  IF TG_OP = 'UPDATE' THEN
    FOR col IN
      SELECT key FROM jsonb_each(to_jsonb(NEW))
      WHERE to_jsonb(NEW) ->> key IS DISTINCT FROM to_jsonb(OLD) ->> key
    LOOP
      changed := array_append(changed, col);
    END LOOP;

    -- Se nada mudou, nao registrar
    IF changed IS NULL OR array_length(changed, 1) IS NULL THEN
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO audit_logs (
    table_name,
    record_id,
    operation,
    old_data,
    new_data,
    changed_fields,
    user_id,
    ip_address,
    user_agent
  ) VALUES (
    TG_TABLE_NAME,
    record_id_value,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    changed,
    auth.uid(),
    inet_client_addr(),
    current_setting('request.headers', true)::json ->> 'user-agent'
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. Aplicar trigger a uma tabela
-- Copiar e substituir {{TABLE}} pelo nome real da tabela
-- -----------------------------------------------------------------------------

CREATE TRIGGER audit_{{TABLE}}_trigger
  AFTER INSERT OR UPDATE OR DELETE ON {{TABLE}}
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- -----------------------------------------------------------------------------
-- 4. Queries uteis para consultar audit logs
-- -----------------------------------------------------------------------------

-- Historico de um registro especifico
-- SELECT * FROM audit_logs WHERE record_id = 'uuid-aqui' ORDER BY created_at DESC;

-- Mudancas recentes por usuario
-- SELECT * FROM audit_logs WHERE user_id = 'uuid-aqui' ORDER BY created_at DESC LIMIT 50;

-- Mudancas em uma tabela nas ultimas 24h
-- SELECT * FROM audit_logs WHERE table_name = 'nome' AND created_at > now() - interval '24 hours';

-- Campos mais alterados (para detectar patterns)
-- SELECT unnest(changed_fields) AS field, count(*) FROM audit_logs
--   WHERE table_name = 'nome' GROUP BY field ORDER BY count DESC;

-- -----------------------------------------------------------------------------
-- Notas
-- -----------------------------------------------------------------------------
-- - SECURITY DEFINER permite que o trigger insira mesmo sem policy de INSERT
-- - changed_fields facilita queries de "o que mudou" sem parsear JSONB
-- - Nao auditar tabelas de alto volume (logs, analytics) — apenas dados de negocio
-- - Para LGPD: criar cron que anonimiza/deleta audit_logs > 2 anos
-- - ip_address e user_agent podem ser NULL em operacoes server-side
