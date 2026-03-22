# Autenticação e Single Sign-On (SSO)

## Visão Geral

A plataforma Layers oferece **dois modos complementares de autenticação**:

1. **OAuth2**: Para cenários que requerem consentimento de escopo e Bearer tokens para consumir APIs
2. **Sessions (Portais)**: Para abrir/validar portais autenticados, seja embarcados ou externos

## Autenticação em Portais (Sessions)

Quando um usuário acessa seu portal através da Layers, a biblioteca LayersPortal.js fornece credenciais que você pode usar para validar a sessão no seu backend.

### Obtendo Credenciais do Portal

```javascript
LayersPortal.on("connected", function() {
  // Credenciais disponíveis
  const session = LayersPortal.session;
  const communityId = LayersPortal.communityId;
  const userId = LayersPortal.userId;

  // Enviar para seu backend validar
  validarSessaoNoBackend(session, communityId, userId);
});
```

### Validando Sessão no Backend

Faça uma requisição para o endpoint de validação da Layers usando seu token de API:

**Endpoint**:
```
GET https://api.layers.digital/v1/sso/session/validate
```

**Headers**:
```
Authorization: Bearer [SEU_LAYERS_TOKEN]
```

**Query Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `session` | String | Token de sessão do usuário |
| `community` | String | ID da comunidade |
| `userId` | String | ID do usuário |

**Exemplo com cURL**:
```bash
curl -X GET \
  "https://api.layers.digital/v1/sso/session/validate?session=SESSION_TOKEN&community=COMMUNITY_ID&userId=USER_ID" \
  -H "Authorization: Bearer SEU_LAYERS_TOKEN"
```

**Exemplo com Node.js**:
```javascript
const axios = require('axios');

async function validarSessao(session, communityId, userId) {
  try {
    const response = await axios.get(
      'https://api.layers.digital/v1/sso/session/validate',
      {
        params: {
          session: session,
          community: communityId,
          userId: userId
        },
        headers: {
          'Authorization': `Bearer ${process.env.LAYERS_TOKEN}`
        }
      }
    );

    if (response.data.valid) {
      console.log('Sessão válida!');
      return response.data;
    }
  } catch (error) {
    console.error('Erro ao validar sessão:', error);
    throw error;
  }
}
```

---

## OAuth2

### Quando Usar OAuth2

Use OAuth2 quando precisar:
- Acessar APIs da Layers em nome do usuário
- Obter consentimento explícito para escopos específicos
- Implementar "Login com Layers" em aplicação externa

### Fluxo OAuth2

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Usuário   │     │  Seu App    │     │   Layers    │     │  Layers API │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       │  1. Clica em      │                   │                   │
       │  "Login com       │                   │                   │
       │   Layers"         │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │                   │  2. Redireciona   │                   │
       │                   │  para autorização │                   │
       │                   │──────────────────▶│                   │
       │                   │                   │                   │
       │         3. Exibe tela de login/consentimento             │
       │◀──────────────────────────────────────│                   │
       │                   │                   │                   │
       │  4. Faz login e   │                   │                   │
       │  aprova escopos   │                   │                   │
       │──────────────────────────────────────▶│                   │
       │                   │                   │                   │
       │                   │  5. Redireciona   │                   │
       │                   │  com código       │                   │
       │                   │◀─────────────────│                   │
       │                   │                   │                   │
       │                   │  6. Troca código  │                   │
       │                   │  por access_token │                   │
       │                   │──────────────────▶│                   │
       │                   │                   │                   │
       │                   │  7. Retorna       │                   │
       │                   │  access_token     │                   │
       │                   │◀─────────────────│                   │
       │                   │                   │                   │
       │                   │  8. Usa token para│                   │
       │                   │  acessar APIs     │                   │
       │                   │─────────────────────────────────────▶│
       │                   │                   │                   │
       │                   │  9. Retorna dados │                   │
       │                   │◀────────────────────────────────────│
```

### Endpoints OAuth2

| Endpoint | Descrição |
|----------|-----------|
| `/oauth/authorize` | Iniciar fluxo de autorização |
| `/oauth/token` | Trocar código por access_token |
| `/v1/oauth/userinfo` | Obter informações do usuário |

### Escopos OAuth2

Os escopos definem quais permissões seu app solicita:

| Escopo | Descrição |
|--------|-----------|
| `openid` | Identificação básica do usuário |
| `profile` | Informações do perfil |
| `email` | Endereço de email |
| `offline_access` | Refresh tokens (acesso offline) |

---

## Fluxo Completo de Autenticação em Portal

### Frontend (JavaScript)

```javascript
// 1. Configurar LayersPortal
window.LayersPortalOptions = {
  appId: "meu-app",
  insidePortalOnly: true
};

// 2. Aguardar conexão e enviar credenciais ao backend
LayersPortal.on("connected", async function() {
  const credenciais = {
    session: LayersPortal.session,
    communityId: LayersPortal.communityId,
    userId: LayersPortal.userId,
    accountId: LayersPortal.accountId
  };

  try {
    // 3. Validar no backend
    const response = await fetch('/api/auth/layers-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credenciais)
    });

    const data = await response.json();

    if (data.valid) {
      // 4. Sessão válida - continuar
      iniciarAplicacao(data.user);
    } else {
      // 5. Sessão inválida
      mostrarErro("Sessão inválida");
    }
  } catch (error) {
    console.error("Erro de autenticação:", error);
    mostrarErro("Erro ao validar sessão");
  }
});
```

### Backend (Node.js/Express)

```javascript
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/auth/layers-session', async (req, res) => {
  const { session, communityId, userId } = req.body;

  try {
    // Validar sessão com API da Layers
    const response = await axios.get(
      'https://api.layers.digital/v1/sso/session/validate',
      {
        params: {
          session,
          community: communityId,
          userId
        },
        headers: {
          'Authorization': `Bearer ${process.env.LAYERS_API_TOKEN}`
        }
      }
    );

    if (response.data.valid) {
      // Buscar ou criar usuário no seu sistema
      const user = await findOrCreateUser({
        layersUserId: userId,
        layersCommunityId: communityId,
        // ... outros dados
      });

      // Criar sessão na sua aplicação
      req.session.user = user;

      res.json({
        valid: true,
        user: {
          id: user.id,
          name: user.name,
          // ... outros dados
        }
      });
    } else {
      res.status(401).json({ valid: false, error: 'Sessão inválida' });
    }
  } catch (error) {
    console.error('Erro ao validar sessão:', error);
    res.status(500).json({ valid: false, error: 'Erro interno' });
  }
});

module.exports = router;
```

---

## Segurança

### Boas Práticas

1. **Sempre valide no backend**
   ```javascript
   // ❌ NUNCA confie apenas no frontend
   const userId = LayersPortal.userId;
   // Não use diretamente sem validação

   // ✅ SEMPRE valide no backend
   const validado = await validarSessaoNoBackend(session, communityId, userId);
   ```

2. **Proteja seu token de API**
   ```javascript
   // ❌ NUNCA exponha no frontend
   const token = "seu_token_secreto"; // Exposto!

   // ✅ Use variáveis de ambiente no backend
   const token = process.env.LAYERS_API_TOKEN;
   ```

3. **Valide a sessão periodicamente**
   ```javascript
   // Revalidar a cada X minutos
   setInterval(async () => {
     const valido = await validarSessao();
     if (!valido) {
       redirecionarParaLogin();
     }
   }, 5 * 60 * 1000); // 5 minutos
   ```

4. **Use HTTPS**
   Todas as comunicações devem ser feitas via HTTPS.

---

## Tratamento de Erros

```javascript
async function autenticar() {
  try {
    const data = await LayersPortal.connectedPromise;

    const response = await validarSessao(
      data.session,
      data.communityId,
      data.userId
    );

    return response;
  } catch (error) {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.error('Sessão expirada ou inválida');
          break;
        case 403:
          console.error('Acesso negado');
          break;
        case 500:
          console.error('Erro no servidor Layers');
          break;
        default:
          console.error('Erro desconhecido');
      }
    } else {
      console.error('Erro de conexão:', error.message);
    }

    throw error;
  }
}
```

---

## Próximo Passo

Veja [Exemplos Práticos](./05-EXEMPLOS-PRATICOS.md) para implementações completas e casos de uso comuns.
