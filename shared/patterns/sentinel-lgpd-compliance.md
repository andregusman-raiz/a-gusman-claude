# SENTINEL LGPD Compliance Checklist

## 1. PII Exposure (Dados Pessoais)

### Padroes para detectar PII em logs/responses
- CPF: `\d{3}\.?\d{3}\.?\d{3}-?\d{2}`
- Email: `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`
- Telefone: `\(?\d{2}\)?\s?\d{4,5}-?\d{4}`
- CEP: `\d{5}-?\d{3}`
- RG: `\d{2}\.?\d{3}\.?\d{3}-?\d{1}`

### Onde verificar
- Server logs (stdout, stderr)
- API response bodies
- Error messages
- Browser console
- Database query logs

### Mascaramento esperado
- CPF: `***.***.***-12` (ultimos 2 digitos)
- Email: `an***@gmail.com` (primeiros 2 chars)
- Telefone: `(**) ****-1234` (ultimos 4 digitos)

## 2. Audit Trail

### Campos obrigatorios
| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID | ID unico do registro |
| user_id | UUID | Quem fez a acao |
| action | TEXT | CREATE, READ, UPDATE, DELETE |
| table_name | TEXT | Tabela afetada |
| record_id | UUID | ID do registro afetado |
| old_value | JSONB | Valor anterior (UPDATE/DELETE) |
| new_value | JSONB | Valor novo (CREATE/UPDATE) |
| ip_address | TEXT | IP do requisitante |
| user_agent | TEXT | Browser/client |
| created_at | TIMESTAMPTZ | Quando aconteceu |

### Verificacao
1. Tabela audit_log existe
2. Trigger ou middleware gera registros
3. Registros sao imutaveis (sem UPDATE/DELETE na tabela)
4. Retencao minima: 5 anos (LGPD)

## 3. Direitos do Titular

### Direito de Acesso (Art. 18, II)
- Endpoint GET /api/user/data ou similar
- Retorna todos os dados do usuario em formato legivel
- Inclui: dados pessoais, historico de acoes, consentimentos

### Direito de Exclusao (Art. 18, VI)
- Endpoint DELETE /api/user ou similar
- Cascade delete em todos os dados associados
- Verificar que nao ha dados orfaos apos exclusao
- Manter apenas dados obrigatorios por lei (fiscal, etc.)

### Direito de Portabilidade (Art. 18, V)
- Export em formato estruturado (JSON ou CSV)
- Inclui todos os dados pessoais

## 4. Consentimento

### Verificacoes
- Termos de uso acessiveis (link no footer ou pagina dedicada)
- Politica de privacidade acessivel
- Cookie consent banner (se usa cookies de terceiros)
- Opt-out de comunicacoes (email marketing)
- Registro de consentimento (quando, o que, versao dos termos)

## 5. Minimizacao de Dados

### Verificacoes
- APIs retornam apenas campos necessarios (nao SELECT *)
- Forms coletam apenas dados essenciais
- Logs nao armazenam dados pessoais desnecessarios
- Dados temporarios sao limpos (sessions, caches)

## Score

Cada item verificado: PASS (1) ou FAIL (0)
Score S6 = items_passed / total_items * 100
