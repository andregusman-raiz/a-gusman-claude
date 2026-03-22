# Solicitação Técnica — Configuração TOTVS RM para App de Chamada

**De:** Equipe de Desenvolvimento
**Para:** TI / Administração TOTVS RM
**Data:** 20/03/2026
**Prioridade:** Alta
**Servidor:** `raizeducacao160286.rm.cloudtotvs.com.br:8051`

---

## Contexto

Estamos desenvolvendo um app mobile (PWA) para registro de frequência escolar, integrado ao TOTVS RM Educacional. O app permite que professores façam a chamada dos alunos pelo celular, gravando diretamente na tabela `SFREQUENCIA` do RM.

O app já está funcional — login, seleção de coligada/filial e identificação do professor funcionam. **Faltam 2 configurações no RM** para completar a integração.

---

## O que funciona hoje

| Recurso | Endpoint | Status |
|---------|----------|--------|
| Autenticação JWT | `POST /api/connect/token/` | OK |
| Contexto do professor | `GET /api/educational/v1/ProfessorContexts` | OK |
| Lista de coligadas | `GET /api/framework/v1/companies` | OK |
| SOAP DataServer | `POST /wsDataServer/IwsDataServer` | OK (com `automacao.acessos`) |
| EduTurmaDiscData (todas turmas) | SOAP ReadView | OK |
| EduProfessorData | SOAP ReadView | OK |

---

## O que precisamos (2 itens)

### Item 1: Sentença SQL para turmas do professor (OBRIGATÓRIO)

O DataServer `EduTurmaDiscData` não tem a coluna `CODPROF` (professor). A ligação professor→turma está na tabela `SPROFTURMADISC`. Precisamos de uma **sentença SQL cadastrada** no RM para consultar as turmas de um professor.

**Ação:** Cadastrar a seguinte sentença no módulo Educacional do RM:

- **Nome da sentença:** `EDU.TURMAS.PROFESSOR`
- **Sistema:** `S` (Educacional)
- **SQL:**

```sql
SELECT
    TD.CODCOLIGADA,
    TD.IDTURMADISC,
    TD.CODTURMA,
    TD.CODDISC,
    TD.NOMEDISC,
    TD.NOMETURNO AS TURNO,
    TD.CODPERIODO,
    PD.CODPROF,
    PD.NOME AS NOMEPROF
FROM STURMADISC TD
INNER JOIN SPROFTURMADISC PT
    ON PT.CODCOLIGADA = TD.CODCOLIGADA
    AND PT.IDTURMADISC = TD.IDTURMADISC
INNER JOIN SPROFESSOR PD
    ON PD.CODCOLIGADA = PT.CODCOLIGADA
    AND PD.CODPROF = PT.CODPROF
WHERE TD.CODCOLIGADA = :CODCOLIGADA
    AND PT.CODPROF = :CODPROF
    AND TD.ATIVA = 'S'
ORDER BY TD.CODTURMA, TD.NOMEDISC
```

**Parâmetros:**
- `:CODCOLIGADA` (int) — Código da coligada
- `:CODPROF` (varchar) — Código do professor

**Como cadastrar:**
1. Abrir o RM → Módulo Globais → Consultas SQL (ou via menu Educacional → Ferramentas → Consultas SQL)
2. Criar nova consulta com o código `EDU.TURMAS.PROFESSOR`
3. Colar o SQL acima
4. Definir os parâmetros `:CODCOLIGADA` e `:CODPROF`
5. **Dar permissão** de execução para o usuário `automacao.acessos`

**Endpoint que usaremos:**
```
POST /wsConsultaSQL/IwsConsultaSQL
SOAPAction: http://www.totvs.com/IwsConsultaSQL/RealizarConsultaSQL
codSentenca: EDU.TURMAS.PROFESSOR
```

---

### Item 2: Permissão SOAP para frequência (OBRIGATÓRIO)

O DataServer `EduFrequenciaDiariaWSData` retorna erro de autorização para o usuário `automacao.acessos`. Precisamos de permissão de **leitura e gravação** nesse DataServer para registrar a frequência.

**Ação:** No RM, dar permissão ao perfil do usuário `automacao.acessos`:

1. Abrir o RM → Módulo Globais → Segurança → Perfis
2. Localizar o perfil associado ao usuário `automacao.acessos`
3. Adicionar permissão de **acesso** ao DataServer `EduFrequenciaDiariaWSData`
   - Operações: `ReadRecord`, `ReadView`, `SaveRecord`
4. Adicionar permissão à tabela `SFREQUENCIA`
   - Operações: `SELECT`, `INSERT`, `UPDATE`

**Alternativa (se perfil não puder ser alterado):**
Criar um novo usuário de serviço dedicado ao app de chamada, com permissões mínimas:
- Leitura: `SPROFTURMADISC`, `STURMADISC`, `SPROFESSOR`, `SFREQUENCIA`
- Escrita: `SFREQUENCIA` (apenas INSERT/UPDATE)

---

### Item 3: Token JWT estendido (OPCIONAL, recomendado)

Atualmente o token JWT expira em **300 segundos (5 minutos)**. Para o app funcionar durante um dia letivo inteiro sem re-login constante, recomendamos estender para **8 horas**.

**Ação:** No arquivo `RM.Host.Service.exe.config` do servidor:

```xml
<add key="JwtTokenExpireMinutes" value="480" />
```

Se houver certificado configurado (`JWTCERTIFICATETHUMBPRINT`), o token pode durar até 12h nativamente.

---

## Teste de validação

Após as configurações, podemos validar com os seguintes comandos:

### Teste da sentença SQL:
```bash
curl -X POST "https://raizeducacao160286.rm.cloudtotvs.com.br:8051/wsConsultaSQL/IwsConsultaSQL" \
  -H "Content-Type: text/xml" \
  -H "Authorization: Bearer {TOKEN}" \
  -H "SOAPAction: http://www.totvs.com/IwsConsultaSQL/RealizarConsultaSQL" \
  -d '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/">
    <soap:Body>
      <tot:RealizarConsultaSQL>
        <tot:codSentenca>EDU.TURMAS.PROFESSOR</tot:codSentenca>
        <tot:codColigada>2</tot:codColigada>
        <tot:codSistema>S</tot:codSistema>
        <tot:parametros>CODCOLIGADA=2;CODPROF=1032</tot:parametros>
      </tot:RealizarConsultaSQL>
    </soap:Body>
  </soap:Envelope>'
```

**Resultado esperado:** Lista de turmas/disciplinas da professora JULIANA YOUSSEF (CODPROF=1032, Coligada 2 - Colégio QI).

### Teste da frequência:
```bash
curl -X POST "https://raizeducacao160286.rm.cloudtotvs.com.br:8051/wsDataServer/IwsDataServer" \
  -H "Content-Type: text/xml" \
  -H "Authorization: Bearer {TOKEN}" \
  -H "SOAPAction: http://www.totvs.com/IwsDataServer/ReadView" \
  -d '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/">
    <soap:Body>
      <tot:ReadView>
        <tot:DataServerName>EduFrequenciaDiariaWSData</tot:DataServerName>
        <tot:Filtro>IDTURMADISC=1</tot:Filtro>
        <tot:Contexto>CODCOLIGADA=2;CODSISTEMA=S;CODFILIAL=2</tot:Contexto>
      </tot:ReadView>
    </soap:Body>
  </soap:Envelope>'
```

**Resultado esperado:** Registros de frequência (ou vazio se não houver para essa turma), sem erro de autorização.

---

## Resumo

| # | O que | Quem faz | Impacto |
|---|-------|----------|---------|
| 1 | Cadastrar sentença `EDU.TURMAS.PROFESSOR` | Admin RM | **App lista turmas do professor** |
| 2 | Permissão SOAP para `EduFrequenciaDiariaWSData` | Admin RM | **App lê/grava frequência** |
| 3 | Estender JWT para 8h | Infra TOTVS Cloud | Professor não precisa re-logar |

Após os itens 1 e 2, o app estará **100% funcional**.

---

## Contato

Dúvidas sobre a integração: [seu email/slack aqui]
