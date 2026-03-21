# Layers Education — API Hub

> Base URL: `https://api.layers.digital`
> Authentication: Bearer Token
> Required Header: `Community-Id` (string)

---

## Visao Geral

O API Hub da Layers permite troca estruturada de informacoes entre aplicacoes usando um protocolo chamado "actions". Suporta dois padroes de comunicacao primarios.

---

## Padroes de Comunicacao

### 1. Request & Respond

Apps consumidores solicitam dados de apps provedores atraves da plataforma Layers. Este padrao e usado por apps de visualizacao para buscar informacoes de ERPs.

**Fluxo:**
1. App consumidor consulta `/v1/services/discover/:action` para identificar provedores disponiveis
2. Consumidor faz POST com payload para a Layers
3. Layers encaminha requisicao ao provedor designado (adicionando chaves `context` e `secret`)
4. Provedor retorna dados no formato especificado
5. Layers entrega resposta ao consumidor

### 2. Publish & Subscribe (Pub/Sub)

Apps provedores enviam notificacoes urgentes a assinantes atraves da Layers. Intents de PubSub sao usados para transmitir informacoes urgentes como notificacoes, nao para busca detalhada de dados.

**Fluxo:**
1. Publicador chama `POST /services/publish/:action` com payload opcional
2. Layers recebe confirmacao (status 201) e encaminha para assinantes
3. Assinantes recebem mensagem e chamam actions relevantes de busca de dados
4. Assinantes processam atualizacoes e respondem adequadamente

> PubSub deve apenas sinalizar eventos urgentes; informacoes detalhadas devem ser recuperadas separadamente usando Request & Respond para prevenir perda de dados se mensagens falharem.

---

## Endpoints

### GET /v1/services/discover/{action} — Descobrir Apps Provedores

Identifica quais apps provedores estao disponiveis para uma action especifica.

**Headers:**
- `Authorization: Bearer {{token_do_seu_app}}`
- `Community-Id: {{id_da_comunidade}}`

**Response:**
```json
[
  {
    "id": "myerp",
    "icon": "https://cdn.layers.digital/admin/uploads/.../icon.png",
    "displayName": "My ERP",
    "versions": [1]
  }
]
```

**Campos de resposta:**
- `id`: Identificador do app provedor
- `icon`: URL do icone do provedor
- `displayName`: Nome legivel do provedor
- `versions`: Array de versoes suportadas da action

### POST /v1/services/call/{action}/{providerId}?version={version} — Solicitar Dados do Provedor

Executa uma action especifica em um provedor identificado.

**Headers:**
- `Authorization: Bearer {{token_do_seu_app}}`
- `Community-Id: {{id_da_comunidade}}`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "data": {
    "example": true
  }
}
```

**Notas:**
- O campo `data` contem parametros especificos da action
- O payload de resposta varia por tipo de action
- Consulte a documentacao especifica de cada action para campos aceitos

### POST /services/publish/{action} — Publicar Evento (Pub/Sub)

Publica um evento para todos os assinantes de uma action.

**Response:** Status 201 (confirmacao de recebimento)

A Layers encaminha a mensagem para todos os assinantes registrados.

---

## Provendo Dados para Actions

Quando a Layers encaminha uma requisicao para um app provedor, ela adiciona automaticamente:
- `context`: Informacoes de contexto da requisicao
- `secret`: Chave secreta para validacao (deve ser verificada contra o secret configurado na criacao do app)

O provedor deve:
1. Validar o `secret` recebido
2. Processar os dados da requisicao
3. Retornar resposta no formato especificado pela action

---

## Actions Conhecidas (Visualization Apps)

| Action | App Visualizador | Descricao |
|--------|-----------------|-----------|
| Prover notas academicas | Notas Academicas | Avaliacoes e desempenho |
| Prover cobrancas | Visao Financeira | Boletos e pagamentos |
| Prover frequencia | Frequencia | Presencas e faltas |
| Prover registros academicos | Registros Academicos | Ocorrencias e observacoes |
| Prover grades horarias | Visao de Horarios | Cronogramas de aulas |
| Prover ficha medica | Ficha Medica | Dados de saude |
| Prover calendario | Calendario | Eventos e atividades |
| Prover documentos | Relatorios | Documentos e formularios |
| Prover entradas/saidas | Entrada e Saida | Registro de presenca fisica |

---

## Notas Importantes

- Sempre valide o `secret` recebido nas requisicoes de provider
- PubSub e para sinalizacao, nao para transferencia massiva de dados
- Use Request & Respond para buscar dados detalhados apos receber PubSub
- Cada action pode ter multiplas versoes — especifique a versao desejada
