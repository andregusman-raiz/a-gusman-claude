# Schema do Banco de Dados

## 1. Visão Geral

O Super Cantina utiliza **PostgreSQL 15+** como banco de dados principal, com as seguintes características:

- **Multi-tenant**: Dados segregados por escola (school_id)
- **Otimizado para leitura**: Agregados pré-calculados para dashboard
- **Auditável**: Event log para rastreabilidade
- **LGPD-compliant**: Dados mínimos, anonimização automática

---

## 2. Diagrama ER

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     schools     │       │      users      │       │    students     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────│ school_id (FK)  │       │ id (PK)         │
│ layers_community│       │ id (PK)         │       │ school_id (FK)  │──►
│ name            │       │ layers_user_id  │       │ name            │
│ default_limit   │       │ role            │       │ grade           │
│ operating_hours │       │ name            │       │ qr_code         │
└─────────────────┘       └────────┬────────┘       │ nfc_tag         │
                                   │                └────────┬────────┘
                                   │                         │
                          ┌────────┴────────┐       ┌────────┴────────┐
                          │guardian_students│       │  student_rules  │
                          ├─────────────────┤       ├─────────────────┤
                          │ guardian_id(FK) │       │ student_id (FK) │
                          │ student_id (FK) │       │ daily_limit     │
                          │ relationship    │       │ blocked_cats    │
                          │ is_primary      │       │ time_restrict   │
                          └─────────────────┘       └─────────────────┘
                                                            │
                                   ┌────────────────────────┼────────────────────────┐
                                   │                        │                        │
                          ┌────────┴────────┐      ┌────────┴────────┐      ┌────────┴────────┐
                          │  transactions   │      │ pending_actions │      │dietary_restrict │
                          ├─────────────────┤      ├─────────────────┤      ├─────────────────┤
                          │ id (PK)         │      │ id (PK)         │      │ id (PK)         │
                          │ student_id (FK) │      │ guardian_id(FK) │      │ student_id (FK) │
                          │ amount          │      │ student_id (FK) │      │ restriction_type│
                          │ decision        │      │ status          │      │ blocked_keywords│
                          │ created_at      │      │ decision_made   │      └─────────────────┘
                          └─────────────────┘      └─────────────────┘
```

---

## 3. Schema SQL Completo

### 3.1 Extensões e Tipos

```sql
-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Busca por similaridade

-- Tipos enumerados
CREATE TYPE user_role AS ENUM (
  'guardian',   -- Responsável
  'student',    -- Aluno (sem acesso ao portal)
  'operator',   -- Operador da cantina
  'admin'       -- Administrador da escola
);

CREATE TYPE purchase_decision AS ENUM (
  'ALLOW',              -- Compra permitida
  'BLOCK_SILENT',       -- Bloqueio silencioso
  'BLOCK_NOTIFY_PARENT' -- Bloqueio com notificação
);

CREATE TYPE block_reason AS ENUM (
  'DAILY_LIMIT',         -- Limite diário excedido
  'CATEGORY_BLOCKED',    -- Categoria bloqueada
  'DIETARY_RESTRICTION', -- Restrição alimentar
  'TIME_RESTRICTION',    -- Fora do horário permitido
  'PARENT_BLOCKED'       -- Bloqueado manualmente pelo responsável
);

CREATE TYPE action_status AS ENUM (
  'pending',      -- Aguardando decisão
  'acknowledged', -- Responsável tomou decisão
  'expired'       -- Expirou sem ação
);
```

### 3.2 Tabela: schools

```sql
-- Escolas (tenants)
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Integração Layers
  layers_community_id VARCHAR(100) NOT NULL UNIQUE,

  -- Dados da escola
  name VARCHAR(255) NOT NULL,

  -- Configurações padrão
  default_daily_limit INTEGER NOT NULL DEFAULT 5000,  -- R$ 50,00 em centavos
  operating_hours_start TIME NOT NULL DEFAULT '07:00',
  operating_hours_end TIME NOT NULL DEFAULT '18:00',
  timezone VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo',

  -- Controle
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_schools_community ON schools(layers_community_id);
CREATE INDEX idx_schools_active ON schools(is_active) WHERE is_active = TRUE;

-- Comentários
COMMENT ON TABLE schools IS 'Escolas cadastradas no sistema (multi-tenant)';
COMMENT ON COLUMN schools.layers_community_id IS 'ID da comunidade no Layers (chave de integração)';
COMMENT ON COLUMN schools.default_daily_limit IS 'Limite diário padrão em centavos';
```

### 3.3 Tabela: users

```sql
-- Usuários (responsáveis, operadores, admins)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relacionamento
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

  -- Integração Layers
  layers_user_id VARCHAR(100) NOT NULL,
  layers_account_id VARCHAR(100),

  -- Dados do usuário
  role user_role NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),

  -- Controle
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT uq_users_layers UNIQUE(school_id, layers_user_id)
);

-- Índices
CREATE INDEX idx_users_school ON users(school_id);
CREATE INDEX idx_users_layers ON users(layers_user_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(school_id, is_active) WHERE is_active = TRUE;

-- Comentários
COMMENT ON TABLE users IS 'Usuários do sistema (responsáveis, operadores, admins)';
COMMENT ON COLUMN users.layers_user_id IS 'ID do usuário no Layers (usado para validação SSO)';
```

### 3.4 Tabela: students

```sql
-- Alunos
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relacionamento
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

  -- Dados do aluno
  name VARCHAR(255) NOT NULL,
  grade VARCHAR(50),  -- Turma/Série

  -- Identificadores únicos
  qr_code VARCHAR(100),
  nfc_tag VARCHAR(100),

  -- Integração (opcional)
  layers_member_id VARCHAR(100),
  external_id VARCHAR(100),  -- ID no sistema da escola

  -- Controle
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT uq_students_qr UNIQUE(school_id, qr_code),
  CONSTRAINT uq_students_nfc UNIQUE(school_id, nfc_tag)
);

-- Índices
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_qr ON students(qr_code) WHERE qr_code IS NOT NULL;
CREATE INDEX idx_students_nfc ON students(nfc_tag) WHERE nfc_tag IS NOT NULL;
CREATE INDEX idx_students_name_trgm ON students USING gin(name gin_trgm_ops);
CREATE INDEX idx_students_active ON students(school_id, is_active) WHERE is_active = TRUE;

-- Comentários
COMMENT ON TABLE students IS 'Alunos cadastrados para uso na cantina';
COMMENT ON COLUMN students.qr_code IS 'Código QR único para identificação (hash)';
COMMENT ON COLUMN students.nfc_tag IS 'Tag NFC única para identificação (hash)';
```

### 3.5 Tabela: guardian_students

```sql
-- Relacionamento responsável-aluno
CREATE TABLE guardian_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relacionamentos
  guardian_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

  -- Dados do vínculo
  relationship VARCHAR(50),  -- mãe, pai, responsável, etc.
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,

  -- Controle
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT uq_guardian_student UNIQUE(guardian_id, student_id)
);

-- Índices
CREATE INDEX idx_guardian_students_guardian ON guardian_students(guardian_id);
CREATE INDEX idx_guardian_students_student ON guardian_students(student_id);
CREATE INDEX idx_guardian_students_primary ON guardian_students(student_id, is_primary)
  WHERE is_primary = TRUE;

-- Comentários
COMMENT ON TABLE guardian_students IS 'Vínculo entre responsáveis e alunos';
COMMENT ON COLUMN guardian_students.is_primary IS 'Responsável principal (recebe notificações)';
```

### 3.6 Tabela: item_categories

```sql
-- Categorias de itens
CREATE TABLE item_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relacionamento
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

  -- Dados
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,

  -- Controle
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT uq_category_name UNIQUE(school_id, name)
);

-- Índices
CREATE INDEX idx_categories_school ON item_categories(school_id);

-- Dados iniciais (exemplo)
-- INSERT INTO item_categories (school_id, name, is_default) VALUES
-- ('...', 'Lanche', true),
-- ('...', 'Bebida', true),
-- ('...', 'Doce', true),
-- ('...', 'Refeição', true);
```

### 3.7 Tabela: student_rules

```sql
-- Regras por aluno
CREATE TABLE student_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relacionamento (1:1 com student)
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE UNIQUE,

  -- Limite diário
  daily_limit INTEGER NOT NULL,  -- centavos

  -- Categorias (arrays de UUIDs)
  allowed_categories UUID[],   -- Se preenchido, só permite essas
  blocked_categories UUID[],   -- Sempre bloqueia essas

  -- Restrições de horário (JSON)
  time_restrictions JSONB,
  -- Exemplo: [{"dayOfWeek": [1,2,3,4,5], "start": "10:00", "end": "11:00"}]

  -- Controle
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_student_rules_student ON student_rules(student_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_student_rules_updated
  BEFORE UPDATE ON student_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Comentários
COMMENT ON TABLE student_rules IS 'Regras de compra por aluno';
COMMENT ON COLUMN student_rules.daily_limit IS 'Limite diário em centavos';
COMMENT ON COLUMN student_rules.time_restrictions IS 'Horários permitidos em JSON';
```

### 3.8 Tabela: dietary_restrictions

```sql
-- Restrições alimentares
CREATE TABLE dietary_restrictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relacionamento
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

  -- Dados
  restriction_type VARCHAR(100) NOT NULL,  -- alergia_amendoim, intolerancia_lactose
  description TEXT,
  severity VARCHAR(20) DEFAULT 'high',  -- low, medium, high

  -- Palavras-chave para bloquear
  blocked_item_keywords TEXT[] NOT NULL DEFAULT '{}',

  -- Controle
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_dietary_student ON dietary_restrictions(student_id);
CREATE INDEX idx_dietary_active ON dietary_restrictions(student_id, is_active)
  WHERE is_active = TRUE;

-- Comentários
COMMENT ON TABLE dietary_restrictions IS 'Restrições alimentares dos alunos';
COMMENT ON COLUMN dietary_restrictions.blocked_item_keywords IS 'Palavras que bloqueiam itens';
```

### 3.9 Tabela: transactions

```sql
-- Transações (compras)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relacionamentos
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  category_id UUID REFERENCES item_categories(id) ON DELETE SET NULL,
  operator_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- PDV
  pdv_id VARCHAR(100) NOT NULL,

  -- Dados da transação
  amount INTEGER NOT NULL,  -- centavos
  decision purchase_decision NOT NULL,
  block_reason block_reason,

  -- Agregados (para evitar recálculo)
  daily_total_after INTEGER,  -- Total do dia após esta transação

  -- Origem
  synced_from_offline BOOLEAN NOT NULL DEFAULT FALSE,
  offline_local_id VARCHAR(100),

  -- Controle
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices otimizados
CREATE INDEX idx_transactions_student_date ON transactions(student_id, created_at DESC);
CREATE INDEX idx_transactions_school_date ON transactions(school_id, created_at DESC);
CREATE INDEX idx_transactions_decision ON transactions(decision)
  WHERE decision != 'ALLOW';
CREATE INDEX idx_transactions_recent ON transactions(student_id, created_at DESC)
  WHERE created_at > NOW() - INTERVAL '30 days';

-- Particionamento por data (opcional para volumes altos)
-- CREATE TABLE transactions_2024_01 PARTITION OF transactions
--   FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Comentários
COMMENT ON TABLE transactions IS 'Registro de todas as transações (compras)';
COMMENT ON COLUMN transactions.amount IS 'Valor em centavos';
COMMENT ON COLUMN transactions.daily_total_after IS 'Cache do total diário após transação';
```

### 3.10 Tabela: pending_actions

```sql
-- Ações pendentes para responsáveis
CREATE TABLE pending_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relacionamentos
  guardian_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,

  -- Dados
  action_type VARCHAR(50) NOT NULL,  -- BLOCKED_ATTEMPT_REVIEW, DIETARY_ALERT
  description TEXT NOT NULL,

  -- Status e decisão
  status action_status NOT NULL DEFAULT 'pending',
  decision_made VARCHAR(50),  -- ALLOW_ONCE, MAINTAIN_BLOCK, ADJUST_RULES

  -- Controle
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days'
);

-- Índices
CREATE INDEX idx_pending_actions_guardian ON pending_actions(guardian_id, status);
CREATE INDEX idx_pending_actions_status ON pending_actions(status)
  WHERE status = 'pending';
CREATE INDEX idx_pending_actions_expires ON pending_actions(expires_at)
  WHERE status = 'pending';

-- Comentários
COMMENT ON TABLE pending_actions IS 'Ações que requerem decisão do responsável';
```

### 3.11 Tabela: daily_aggregates

```sql
-- Agregados diários (cache para consultas rápidas)
CREATE TABLE daily_aggregates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Chave composta
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Agregados
  total_spent INTEGER NOT NULL DEFAULT 0,  -- centavos
  transaction_count INTEGER NOT NULL DEFAULT 0,
  blocked_count INTEGER NOT NULL DEFAULT 0,

  -- Controle
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint
  CONSTRAINT uq_daily_aggregate UNIQUE(student_id, date)
);

-- Índice para lookup rápido
CREATE INDEX idx_daily_aggregates_lookup ON daily_aggregates(student_id, date DESC);

-- Função para atualizar agregado
CREATE OR REPLACE FUNCTION update_daily_aggregate()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_aggregates (student_id, date, total_spent, transaction_count, blocked_count)
  VALUES (
    NEW.student_id,
    DATE(NEW.created_at),
    CASE WHEN NEW.decision = 'ALLOW' THEN NEW.amount ELSE 0 END,
    1,
    CASE WHEN NEW.decision != 'ALLOW' THEN 1 ELSE 0 END
  )
  ON CONFLICT (student_id, date) DO UPDATE SET
    total_spent = daily_aggregates.total_spent +
      CASE WHEN NEW.decision = 'ALLOW' THEN NEW.amount ELSE 0 END,
    transaction_count = daily_aggregates.transaction_count + 1,
    blocked_count = daily_aggregates.blocked_count +
      CASE WHEN NEW.decision != 'ALLOW' THEN 1 ELSE 0 END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_daily_aggregate
  AFTER INSERT ON transactions
  FOR EACH ROW
  WHEN (NEW.student_id IS NOT NULL)
  EXECUTE FUNCTION update_daily_aggregate();

-- Comentários
COMMENT ON TABLE daily_aggregates IS 'Cache de agregados diários por aluno';
```

### 3.12 Tabela: events

```sql
-- Log de eventos (Event Sourcing / Auditoria)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Tipo de evento
  event_type VARCHAR(100) NOT NULL,
  -- Exemplos: purchase.allowed, purchase.blocked, limit.reached

  -- Agregado relacionado
  aggregate_id UUID NOT NULL,
  aggregate_type VARCHAR(50) NOT NULL,  -- transaction, student, rule

  -- Payload
  payload JSONB NOT NULL,

  -- Metadados
  actor_id UUID,  -- Quem causou o evento (user ou system)
  actor_type VARCHAR(20),  -- user, system, pdv

  -- Controle
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_events_aggregate ON events(aggregate_type, aggregate_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_created ON events(created_at DESC);

-- Particionamento por data recomendado para produção
-- Esta tabela pode crescer muito

-- Comentários
COMMENT ON TABLE events IS 'Log imutável de eventos do sistema';
```

### 3.13 Tabela: pdv_devices

```sql
-- Dispositivos PDV
CREATE TABLE pdv_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relacionamento
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

  -- Identificação
  device_id VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255),
  location VARCHAR(255),  -- Ex: "Cantina Principal", "Quiosque Pátio"

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_seen_at TIMESTAMP WITH TIME ZONE,

  -- Configuração
  config JSONB DEFAULT '{}',

  -- Controle
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_pdv_devices_school ON pdv_devices(school_id);
CREATE INDEX idx_pdv_devices_active ON pdv_devices(school_id, is_active)
  WHERE is_active = TRUE;

-- Comentários
COMMENT ON TABLE pdv_devices IS 'Dispositivos PDV registrados';
```

### 3.14 Tabela: sync_queue

```sql
-- Fila de sincronização (transações offline)
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Origem
  pdv_id VARCHAR(100) NOT NULL,
  local_id VARCHAR(100) NOT NULL,

  -- Payload
  payload JSONB NOT NULL,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- pending, processing, completed, failed

  -- Retry
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,

  -- Controle
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Constraint
  CONSTRAINT uq_sync_queue_local UNIQUE(pdv_id, local_id)
);

-- Índices
CREATE INDEX idx_sync_queue_status ON sync_queue(status, created_at)
  WHERE status = 'pending';

-- Comentários
COMMENT ON TABLE sync_queue IS 'Fila de transações offline aguardando sync';
```

---

## 4. Queries Críticas

### 4.1 Consultar Gasto Diário (Decision Engine)

```sql
-- Query otimizada para decision engine (< 10ms)
-- Usa daily_aggregates para evitar SUM em transactions

SELECT COALESCE(total_spent, 0) as daily_spent
FROM daily_aggregates
WHERE student_id = $1
  AND date = CURRENT_DATE;
```

### 4.2 Dashboard do Responsável

```sql
-- Query para estado do dashboard
SELECT
  s.id,
  s.name,
  COALESCE(da.total_spent, 0) as daily_spent,
  sr.daily_limit,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pending_actions pa
      WHERE pa.student_id = s.id
        AND pa.guardian_id = $1
        AND pa.status = 'pending'
    ) THEN 'ACTION_REQUIRED'
    WHEN COALESCE(da.total_spent, 0) >= sr.daily_limit THEN 'LIMIT_REACHED'
    ELSE 'OK'
  END as status,
  (
    SELECT json_build_object(
      'timestamp', t.created_at,
      'type', CASE WHEN t.decision = 'ALLOW' THEN 'purchase' ELSE 'blocked' END,
      'amount', t.amount
    )
    FROM transactions t
    WHERE t.student_id = s.id
    ORDER BY t.created_at DESC
    LIMIT 1
  ) as last_activity
FROM guardian_students gs
JOIN students s ON s.id = gs.student_id AND s.is_active = TRUE
LEFT JOIN student_rules sr ON sr.student_id = s.id
LEFT JOIN daily_aggregates da ON da.student_id = s.id AND da.date = CURRENT_DATE
WHERE gs.guardian_id = $1;
```

### 4.3 Regras do Aluno com Restrições

```sql
-- Query completa de regras para cache do PDV
SELECT
  sr.daily_limit,
  sr.blocked_categories,
  sr.allowed_categories,
  sr.time_restrictions,
  s.name as student_name,
  s.qr_code,
  s.nfc_tag,
  COALESCE(da.total_spent, 0) as current_daily_spent,
  ARRAY_AGG(DISTINCT dr.restriction_type) FILTER (WHERE dr.id IS NOT NULL) as dietary_restrictions,
  ARRAY_AGG(DISTINCT dr.blocked_item_keywords) FILTER (WHERE dr.id IS NOT NULL) as blocked_keywords
FROM student_rules sr
JOIN students s ON s.id = sr.student_id
LEFT JOIN daily_aggregates da ON da.student_id = s.id AND da.date = CURRENT_DATE
LEFT JOIN dietary_restrictions dr ON dr.student_id = s.id AND dr.is_active = TRUE
WHERE sr.student_id = $1
GROUP BY sr.id, s.id, da.total_spent;
```

---

## 5. Migrations

### Ordem de Execução

```
001_create_extensions.sql
002_create_types.sql
003_create_schools.sql
004_create_users.sql
005_create_students.sql
006_create_guardian_students.sql
007_create_item_categories.sql
008_create_student_rules.sql
009_create_dietary_restrictions.sql
010_create_transactions.sql
011_create_pending_actions.sql
012_create_daily_aggregates.sql
013_create_events.sql
014_create_pdv_devices.sql
015_create_sync_queue.sql
016_create_triggers.sql
017_create_indexes.sql
```

---

## 6. Manutenção

### 6.1 Jobs de Limpeza

```sql
-- Executar diariamente: expirar ações pendentes
UPDATE pending_actions
SET status = 'expired'
WHERE status = 'pending'
  AND expires_at < NOW();

-- Executar semanalmente: limpar sync_queue antiga
DELETE FROM sync_queue
WHERE status IN ('completed', 'failed')
  AND created_at < NOW() - INTERVAL '7 days';

-- Executar mensalmente: anonimizar transações antigas
UPDATE transactions
SET
  student_id = NULL,
  operator_id = NULL,
  pdv_id = 'ANONYMIZED'
WHERE created_at < NOW() - INTERVAL '90 days'
  AND student_id IS NOT NULL;
```

### 6.2 Vacuum e Analyze

```sql
-- Tabelas com alta taxa de atualização
VACUUM ANALYZE transactions;
VACUUM ANALYZE daily_aggregates;
VACUUM ANALYZE sync_queue;

-- Configurar autovacuum agressivo
ALTER TABLE transactions SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE daily_aggregates SET (autovacuum_vacuum_scale_factor = 0.05);
```

---

## Próximos Documentos

- [Queries Críticas](./queries-criticas.md)
- [Performance e Otimização](./performance.md)
