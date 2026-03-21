# Guia de Integração TOTVS RM Educacional — Lições Aprendidas

> Documento de referência para construção de módulos integrados ao TOTVS RM da Raiz Educação.
> Baseado na experiência real de desenvolvimento do App de Chamada (Mar 2026).

---

## 1. Infraestrutura e Conectividade

### Servidor
- **Host**: `raizeducacao160286.rm.cloudtotvs.com.br:8051`
- **Protocolo**: HTTPS (obrigatório)
- **Hospedagem**: TOTVS Cloud (PaaS gerenciado pela TOTVS)

### Conectividade — CUIDADO
- A TOTVS Cloud **bloqueia conexões de IPs externos** para endpoints SOAP
- REST funciona de qualquer lugar, SOAP só funciona da **mesma rede ou IPs autorizados**
- **Vercel/AWS/cloud pública → SOAP falha** com timeout ou conexão recusada
- **Solução**: hospedar o backend na mesma rede do TOTVS (VPS/Docker) ou solicitar whitelist de IPs à TOTVS

### Token JWT
- **Validade**: 300 segundos (5 minutos!) — muito curto
- **Configurável**: via `RM.Host.Service.exe.config` → `JwtTokenExpireMinutes` (pedir à TI para estender para 480min)
- **Cache obrigatório**: renovar automaticamente 30s antes de expirar
- **Cada chamada API consome 1 licença RM** — cache agressivo é essencial

---

## 2. Autenticação

### Endpoint
```
POST /api/connect/token/
Content-Type: application/json
Body: {"grant_type": "password", "username": "xxx", "password": "xxx"}
Response: { "access_token": "jwt...", "expires_in": 300, "token_type": "Bearer" }
```

### Tipos de conta
| Tipo | Uso | Vantagem | Desvantagem |
|------|-----|----------|-------------|
| **Professor** (CPF como user/pass) | Login do app, REST APIs | Acesso aos endpoints do Portal do Professor | Token 300s, sem acesso SOAP |
| **Service Account** (automacao.acessos) | SOAP DataServers | Acesso amplo, pode ler/gravar dados | Não tem contexto de professor |

### Estratégia recomendada: dual-token
1. Professor autentica no app (REST) → token para APIs do Portal
2. Service account autentica no backend → token para SOAP
3. Backend faz proxy: usa token do professor para REST, service account para SOAP

---

## 3. APIs REST Educacionais

### Formato de resposta
O TOTVS **NÃO** usa OData padrão. O formato real é:
```json
{
  "hasNext": false,
  "total": 28,
  "items": [...]    // ← NÃO "value", é "items"!
}
```

**Erro comum**: assumir `data.value` (OData). Usar: `data.items || data.value || []`

### Endpoints disponíveis (confirmados no servidor da Raiz)

| Endpoint | Status | Observação |
|----------|--------|------------|
| `GET /api/educational/v1/ProfessorContexts` | ✅ | Retorna coligadas/filiais do professor |
| `GET /api/educational/v1/Professors/{internalId}/disciplineclasses` | ✅ | Turmas do professor |
| `GET /api/educational/v1/Professors/{internalId}/disciplineclasses/{classId}/students` | ✅ | Alunos de uma turma |
| `GET /api/educational/v1/Professors/{internalId}/timetable` | ✅ | Grade horária semanal |
| `GET /api/educational/v1/Professors/{internalId}/lessonPlans` | ⚠️ | Precisa de param `Etapa` (não funcionou) |
| `GET /api/educational/v1/Professors/{internalId}/assignments` | ❌ 403 | Sem permissão |
| `GET /api/educational/v1/Professors/{internalId}/classShifts` | ❌ 403 | Sem permissão |
| `GET /api/educational/v1/StudentContexts` | ✅ | Retorna 0 items (usar students sub-endpoint) |
| `POST /api/educational/v1/.../dailyFrequency` | ❌ 411/404 | Não implementado |
| `GET /api/framework/v1/companies` | ✅ | Lista todas coligadas (31 na Raiz) |

### internalId — A CHAVE DO SUCESSO

O campo mais importante é o `internalId` retornado pelo `ProfessorContexts`:
```
"internalId": "2|2|1|1032"
```
Formato: `companyCode|branchCode|levelEducationalCode|professorCode`

**REGRA CRÍTICA**: Endpoints como `disciplineclasses` e `students` precisam do **internalId completo** como path parameter, **NÃO** apenas o `professorCode`.

```
❌ GET /Professors/1032/disciplineclasses → 500 Internal Server Error
✅ GET /Professors/2%7C2%7C1%7C1032/disciplineclasses → 200 OK
```

O `|` deve ser URL-encoded como `%7C`.

### classId para students
```
GET /Professors/{profInternalId}/disciplineclasses/{companyCode|disciplineClassCode}/students
Exemplo: /Professors/2%7C2%7C1%7C1032/disciplineclasses/2%7C21624/students
```

### Campos reais vs documentação
A documentação TOTVS usa nomes genéricos. Os campos reais no JSON retornado:

| Documentação | Campo real (ProfessorContexts) |
|-------------|-------------------------------|
| CodColigada | `companyCode` |
| CodFilial | `branchCode` |
| CodProfessor | `professorCode` |
| Nome | `professorName` |
| NomeColigada | `company` |
| NomeFilial | `branch` |

| Documentação | Campo real (disciplineclasses) |
|-------------|-------------------------------|
| IdTurmaDisc | `disciplineClassCode` |
| CodTurma | `classCode` |
| NomeDisc | `disciplineDescription` |
| Turno | `shiftDescription` |
| CodEtapa | `termCode` |
| IdPerlet | `termId` |

| Documentação | Campo real (students) |
|-------------|----------------------|
| RA | `studentCode` |
| Nome | `studentName` |
| Numero | `diaryNumber` |

### Filtrar por período ativo
O endpoint `disciplineclasses` retorna **TODAS** as turmas (incluindo períodos encerrados). Filtrar client-side:
```typescript
const currentYear = new Date().getFullYear().toString();
items.filter(t => !t.isFinishedTerm && t.termCode >= currentYear);
```

### Paginação
O endpoint `students` retorna max ~20 por página. Usar `hasNext` + `page` para paginar:
```
?page=1&pageSize=50
```

---

## 4. SOAP DataServers

### Endpoint correto
```
POST https://raizeducacao160286.rm.cloudtotvs.com.br:8051/wsDataServer/IwsDataServer
SOAPAction: http://www.totvs.com/IwsDataServer/{action}
Content-Type: text/xml; charset=utf-8
Authorization: Bearer {token}
```

**CUIDADO com o path!** Testamos vários e só um funciona:

| Path | Status |
|------|--------|
| `/wsDataServer/MEX` | ❌ 404 |
| `/wsDataServer/MEXService.svc` | ❌ 404 |
| `/wsDataServer/IwsDataServer.svc` | ❌ 404 |
| `/wsDataServer` | ❌ 404 (POST) / 200 (GET = info page) |
| **`/wsDataServer/IwsDataServer`** | **✅ Funciona** |

O WSDL em `/wsDataServer/mex?singleWsdl` confirma os endpoints reais.

### DataServers disponíveis

| DataServer | ReadView | ReadRecord | SaveRecord | Permissão |
|------------|----------|------------|------------|-----------|
| `EduTurmaDiscData` | ✅ (115K registros!) | ⚠️ | N/T | automacao.acessos |
| `EduProfessorData` | ✅ | N/T | N/T | automacao.acessos |
| `EduPlanoAulaData` | ✅ | N/T | N/T | automacao.acessos |
| `EduFrequenciaDiariaWSData` | ❌ Bug ("Index out of bounds") | ✅ | ✅ | automacao.acessos |
| `EduAlunoData` | ❌ Sem permissão | N/T | N/T | — |
| `GColigadaData` | ❌ Sem resposta | N/T | N/T | — |

### SOAP Envelope padrão
```xml
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tot="http://www.totvs.com/">
  <soap:Body>
    <tot:{Action}>
      <tot:DataServerName>{DataServerName}</tot:DataServerName>
      ...
      <tot:Contexto>CODCOLIGADA={cod};CODSISTEMA=S;CODFILIAL={filial}</tot:Contexto>
    </tot:{Action}>
  </soap:Body>
</soap:Envelope>
```

### ReadView — Cuidados com filtros
- **Subqueries bloqueadas**: `IN (SELECT ...)` → "Instruções SQL proibidas"
- **Colunas ambíguas**: qualificar com nome da tabela: `SPLANOAULA.IDTURMADISC=21624`
- **Filtro obrigatório em alguns DataServers**: `EduFrequenciaDiariaWSData` rejeita filtro vazio

### ReadRecord — Primary Key
Formato: valores separados por `;`
```
EduFrequenciaDiariaWSData PK: codColigada;idHorarioTurma;idTurmaDisc;RA;DD/MM/YYYY HH:MM:SS
Exemplo: 2;22879;21624;QI20011631;17/03/2026 00:00:00
```

**CUIDADO**: data no formato DD/MM/YYYY (brasileiro), NÃO ISO.

### SaveRecord — EduFrequenciaDiariaWSData

O DataServer de frequência é **especial** e requer estrutura XML específica:

```xml
<EduFrequenciaDiaria>
  <PARAMS>
    <CODCOLIGADA>2</CODCOLIGADA>
    <IDTURMADISC>21624</IDTURMADISC>
    <CODETAPA>1</CODETAPA>
    <AULASDADAS>2</AULASDADAS>
    <DATA>2026-03-17T00:00:00</DATA>
    <IDHORARIOTURMA>22879</IDHORARIOTURMA>
  </PARAMS>
  <SFREQUENCIA>
    <CODCOLIGADA>2</CODCOLIGADA>
    <IDTURMADISC>21624</IDTURMADISC>
    <IDHORARIOTURMA>22879</IDHORARIOTURMA>
    <RA>QI20011631</RA>
    <PRESENCA>A</PRESENCA>
    <JUSTIFICADA>0</JUSTIFICADA>
    <DATA>2026-03-17T00:00:00</DATA>
    <CODETAPA>1</CODETAPA>
    <AULASDADAS>2</AULASDADAS>
  </SFREQUENCIA>
</EduFrequenciaDiaria>
```

**Aprendizados do SaveRecord**:
1. **PARAMS obrigatório** — sem ele: "Não foi encontrado o DataSet PARAMS"
2. **IDHORARIOTURMA obrigatório** — sem ele: "Column IDHORARIOTURMA does not belong to table"
3. **IDHORARIOTURMA deve vir do plano de aula**, NÃO pode ser 0 — com 0: "Não existe plano de aula cadastrado"
4. **O TOTVS só grava ausentes** — presentes não geram registro na SFREQUENCIA
5. **SaveRecordResult vazio = sucesso** — result com texto = erro (mas primary key = sucesso também!)
6. **RA deve pertencer à turma** — RA errado: "O RA informado não possui matrícula na Turma/Disciplina"

### wsConsultaSQL
```
POST /wsConsultaSQL/IwsConsultaSQL
SOAPAction: http://www.totvs.com/IwsConsultaSQL/RealizarConsultaSQL
```
- **NÃO aceita SQL inline** — apenas sentenças pré-cadastradas no RM
- Parâmetro `codSentenca` é o nome da sentença, não SQL

---

## 5. Plano de Aula (EduPlanoAulaData)

O plano de aula é **fundamental** — define:
- **Quais dias** o professor tem aula (DATA)
- **IDHORARIOTURMA** necessário para gravar frequência
- **Número da aula** no semestre (AULA)
- **Horários** (HORAINICIAL, HORAFINAL)

### Campos importantes
```xml
<SPlanoAula>
  <CODCOLIGADA>2</CODCOLIGADA>
  <IDHORARIOTURMA>22879</IDHORARIOTURMA>  <!-- CHAVE para gravação de frequência -->
  <DIASEMANA>3</DIASEMANA>                <!-- 1=Dom...7=Sab -->
  <HORAINICIAL>11:50</HORAINICIAL>
  <HORAFINAL>12:40</HORAFINAL>
  <DATA>2026-03-17T00:00:00</DATA>
  <AULA>19</AULA>                         <!-- Número sequencial no semestre -->
  <IDTURMADISC>21624</IDTURMADISC>
  <CONFIRMADO>N</CONFIRMADO>
  <IDPLANOAULA>875403</IDPLANOAULA>
  <IDPERLET>266</IDPERLET>
  <FREQUENCIADISPWEB>0</FREQUENCIADISPWEB> <!-- 0=não liberada, 1=liberada -->
</SPlanoAula>
```

### Usar plano de aula para filtrar turmas por dia
Em vez de `timetable` (que mostra dias da semana genéricos), usar `EduPlanoAulaData` para saber exatamente quais datas têm aula — respeitando feriados e recessos.

---

## 6. Frequência — Modelo de Dados

### O TOTVS só grava FALTAS
A tabela SFREQUENCIA registra **apenas ausências**. Presença é inferida pela ausência de registro.

| Cenário | SFREQUENCIA | Interpretação |
|---------|-------------|---------------|
| Aluno sem registro para a data | Nenhuma linha | **PRESENTE** |
| Aluno com registro PRESENCA='A' | 1 linha | **AUSENTE** |
| Aluno com registro PRESENCA='P' | Raro | Presente (explícito) |

### Implicações para o app
- **Ao salvar**: enviar todos os alunos no XML, TOTVS grava apenas os ausentes
- **Ao ler**: fazer ReadRecord por aluno — sem registro = presente, com registro 'A' = ausente
- **ReadView do EduFrequenciaDiariaWSData tem bug** ("Index out of bounds") — usar ReadRecord individual

### Estratégia de leitura otimizada
28 ReadRecords individuais são lentos (~30s). Otimização:
1. **Probe**: checar primeiros 5 + 3 distribuídos na lista (8 requests)
2. Se algum retorna 'A' → chamada existe → checar restantes em batches de 10
3. Se todos retornam null → chamada não foi feita → mostrar todos como ⬜

---

## 7. Multi-Coligada / Multi-Filial

A Raiz tem **31 coligadas**. O professor pode ter vínculo em várias.

### Fluxo de login
1. `POST /api/connect/token/` → JWT
2. `GET /ProfessorContexts?CodSistema=S` (sem filtro de coligada) → lista todos os vínculos
3. Se 1 vínculo: login direto. Se N: tela de seleção de unidade
4. Salvar `codColigada`, `codFilial`, `internalId` na sessão

### Propagação do contexto
Toda chamada REST e SOAP precisa do contexto:
- REST: `?CodColigada={cod}&CodSistema=S&CodFilial={filial}`
- SOAP: `<Contexto>CODCOLIGADA={cod};CODSISTEMA=S;CODFILIAL={filial}</Contexto>`

---

## 8. Falsos Positivos e Armadilhas

### "DisciplineClasses failed (500)"
- **Causa**: usando `professorCode` (1032) em vez do `internalId` completo (2|2|1|1032)
- **Fix**: sempre usar `internalId` URL-encoded

### "0 alunos" mas turma existe
- **Causa**: token do professor expirou (300s)
- **Fix**: service account como fallback para REST APIs

### ReadView retorna dados mas 0 registros parseados
- **Causa**: resposta HTML-encoded (`&lt;` em vez de `<`)
- **Fix**: decodificar antes de parsear: `.replace(/&lt;/g, '<').replace(/&gt;/g, '>')`

### SaveRecord retorna "sucesso" mas dados não gravaram
- **Causa**: IDHORARIOTURMA=0 (inválido) — TOTVS aceita silenciosamente
- **Fix**: usar IDHORARIOTURMA real do plano de aula

### SaveRecord retorna primary key no result
- **Causa**: TOTVS retorna PK do registro criado/atualizado como string
- **NÃO é erro**: resultado com texto sem "Exception" ou "at RM." = sucesso

### "Não existe plano de aula cadastrado"
- **Causa**: IDHORARIOTURMA errado ou plano de aula não existe para a data
- **Fix**: buscar IDHORARIOTURMA do EduPlanoAulaData para a data específica

---

## 9. Performance e Cache

### TTLs recomendados
| Dado | TTL | Motivo |
|------|-----|--------|
| Token service account | `expires_in - 30s` | Auto-refresh |
| ProfessorContexts | 24h | Não muda durante o dia |
| disciplineclasses | 24h | Grade fixa por semestre |
| Alunos (students) | 24h | Lista fixa por período |
| Planos de aula | 24h | Fixos por semestre |
| Frequência | 0 (sem cache) | Deve ser real-time |

### Economia de licenças
Cada request API consome 1 licença RM. Com cache de 24h:
- Sem cache: ~100+ requests/professor/dia
- Com cache: ~5-10 requests/professor/dia
- **Redução de ~90%** no consumo de licenças

---

## 10. Stack Técnica Validada

| Componente | Escolha | Motivo |
|------------|---------|--------|
| Framework | Next.js 16 (App Router) | SSR, API routes como proxy |
| SOAP | fetch + XML string builder | Sem dependência de lib SOAP |
| REST | fetch nativo | Headers Bearer Token |
| Cache | In-memory Map com TTL | Simples, sem dependência |
| Auth | Cookies httpOnly | Segurança (token não exposto ao client) |
| Estado | React useState | Simples para app small |

### Não usar
- Libs SOAP (soap, strong-soap) — overhead desnecessário, fetch funciona
- `@vercel/postgres` / `@vercel/kv` — app não precisa de banco próprio, TOTVS é o banco
- Deployment na Vercel para SOAP — firewall TOTVS bloqueia

---

## 11. Checklist para Novo Módulo

- [ ] Testar conectividade REST com token do professor
- [ ] Testar conectividade SOAP com service account
- [ ] Identificar endpoints REST disponíveis (muitos retornam 404 ou 501)
- [ ] Mapear campos reais do JSON (diferem da documentação TOTVS)
- [ ] Usar `internalId` completo em path params
- [ ] Implementar dual-token (professor + service account)
- [ ] Cache agressivo com TTL adequado
- [ ] Timeout de 10s em chamadas SOAP
- [ ] Decodificar HTML entities nas respostas SOAP
- [ ] Testar em rede local antes de deploy cloud

---

## 12. Contatos e Recursos

| Recurso | URL/Caminho |
|---------|-------------|
| TOTVS API Portal | https://api.totvs.com.br/ |
| TDN (documentação) | https://tdn.totvs.com/display/public/LRM |
| Swagger do servidor | https://raizeducacao160286.rm.cloudtotvs.com.br:8051/api/swagger |
| WSDL DataServer | https://raizeducacao160286.rm.cloudtotvs.com.br:8051/wsDataServer/mex?singleWsdl |
| Base de conhecimento local | `~/Claude/projetos/maquina-melhoria-processos/knowledge/totvs/` |
| App de Chamada (referência) | `~/Claude/projetos/chamada-app/` |

---

*Documento gerado em 21/03/2026 com base no desenvolvimento do App de Chamada Escolar.*
*Testado contra o servidor TOTVS RM Cloud da Raiz Educação (coligada 2 — Colégio QI Tijuca).*
