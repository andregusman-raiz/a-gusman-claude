# Enterprise API Integration Patterns (Cross-Project)

> Estratégias para integrar com ERPs e sistemas enterprise legados (TOTVS, SAP, Oracle, etc.).
> Baseado na experiência real com TOTVS RM Cloud (2026).

---

## 1. Test-Before-Build

Antes de escrever qualquer código de integração:

1. **Testar conectividade** com curl/Postman contra o servidor real
2. **Verificar quais endpoints existem** (muitos retornam 404/501 mesmo documentados)
3. **Mapear campos reais** — documentação enterprise SEMPRE diverge da implementação
4. **Testar SOAP separadamente** do REST — podem ter paths, permissões e firewall diferentes
5. **Verificar firewall** — cloud providers (Vercel, AWS Lambda) podem ser bloqueados

```bash
# Template de teste rápido
curl -sk -o /dev/null -w "%{http_code}" "https://server:port/endpoint" -H "Authorization: Bearer $TOKEN"
```

## 2. Dual-Token Authentication

Sistemas enterprise frequentemente têm perfis de acesso distintos. Usar dois tokens:

| Token | Fonte | Uso | Refresh |
|-------|-------|-----|---------|
| **User Token** | Login do usuário | REST APIs contextuais | A cada request se expirado |
| **Service Account** | Credenciais em env var | SOAP, operações bulk, fallback | Cache com auto-refresh |

```typescript
// Padrão: tentar user token, fallback para service account
let data;
try {
  data = await fetchWithUserToken(endpoint);
} catch {
  data = await fetchWithServiceToken(endpoint); // fallback
}
```

### Por que não usar só o service account?
- Endpoints contextuais (ex: "turmas do professor") precisam do perfil do usuário
- Service account pode não ter acesso a todos os endpoints REST
- Licenciamento: service account = 1 licença compartilhada

## 3. Cache por Licença

ERPs enterprise cobram **por chamada API** (licença por request). Cache agressivo é obrigatório.

```typescript
const TTL = {
  STATIC_DATA: 24 * 60 * 60 * 1000,    // Dados que não mudam no dia (turmas, alunos, configurações)
  SESSION_DATA: 8 * 60 * 60 * 1000,     // Dados da sessão do usuário
  TRANSACTIONAL: 0,                      // Dados que devem ser real-time (frequência, notas)
};
```

**Economia típica**: 80-90% menos chamadas com cache de 24h para dados estáticos.

## 4. Proxy Architecture

O frontend **NUNCA** fala diretamente com o ERP. Sempre via API routes do backend:

```
Frontend (React) → API Routes (Next.js) → ERP (TOTVS/SAP)
```

### Benefícios
- Credenciais do ERP ficam server-side (env vars)
- Token management centralizado (refresh automático)
- Rate limiting protege licenças
- Transformação de dados (campo do ERP → campo do app)
- Cache server-side

## 5. Field Mapping Defensivo

Documentação enterprise está **sempre desatualizada**. Mapear campos defensivamente:

```typescript
// ❌ Frágil — assume nome exato do campo
const name = data.Nome;

// ✅ Defensivo — tenta variações conhecidas
const name = String(data.professorName ?? data.Nome ?? data.nome ?? "");
```

### Estratégia de descoberta
1. Fazer uma chamada real com 1 registro
2. Imprimir o JSON completo
3. Mapear campos reais
4. Documentar divergências da documentação oficial

## 6. SOAP sem Bibliotecas

Libs SOAP (node-soap, strong-soap) são pesadas e frequentemente não funcionam com servers enterprise. Usar fetch + XML manual:

```typescript
async function soapCall(url, token, action, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Authorization": `Bearer ${token}`,
      "SOAPAction": `http://namespace/${action}`,
    },
    body: `<?xml version="1.0"?><soap:Envelope xmlns:soap="...">${body}</soap:Envelope>`,
    signal: controller.signal,
  });

  clearTimeout(timeout);
  return res.text();
}
```

### Parsing de resposta SOAP
- Respostas frequentemente vêm **HTML-encoded** (`&lt;` em vez de `<`)
- Decodificar antes de parsear: `.replace(/&lt;/g, '<').replace(/&gt;/g, '>')`
- Usar regex para extrair valores — DOM parser é overkill para responses simples

## 7. Batch Operations

Quando precisa consultar N registros individualmente (ex: frequência por aluno):

```typescript
// Probe: checar amostra para decidir se precisa checar todos
const PROBE_SIZE = 8;
const probeResults = await Promise.all(
  sampleIndices.map(i => checkRecord(items[i]))
);

const needsFullCheck = probeResults.some(r => r !== null);

if (needsFullCheck) {
  // Checar restantes em batches paralelos
  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    await Promise.all(batch.map(item => checkRecord(item)));
  }
}
```

## 8. Error Translation

Erros de ERPs são técnicos e incompreensíveis para o usuário. Traduzir:

```typescript
const ERROR_MAP = {
  "plano de aula": "Não existe plano de aula para esta data. Contate o coordenador.",
  "não possui matrícula": "Aluno não está matriculado nesta turma.",
  "autorizado": "Sem permissão. Contate a TI.",
  "Input string was not in a correct format": "Formato de dados inválido.",
};

function translateError(raw: string): string {
  for (const [key, msg] of Object.entries(ERROR_MAP)) {
    if (raw.includes(key)) return msg;
  }
  return "Erro ao comunicar com o sistema.";
}
```

## 9. Checklist de Integração Enterprise

- [ ] Testar conectividade (curl) antes de codar
- [ ] Mapear campos reais vs documentação
- [ ] Implementar dual-token (user + service account)
- [ ] Cache com TTL adequado por tipo de dado
- [ ] Proxy server-side (nunca expor credenciais ao client)
- [ ] Timeout em todas as chamadas (10s)
- [ ] Rate limiting para proteger licenças
- [ ] Error translation para mensagens user-friendly
- [ ] Fallback para service account quando token do user expira
- [ ] Testar em rede local antes de deploy cloud (firewall!)
