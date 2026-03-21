# Documentação Layers Portal

Documentação completa sobre o funcionamento do Layers Portal, biblioteca LayersPortal.js e integração com a plataforma Layers Education.

## Índice

| Arquivo | Descrição |
|---------|-----------|
| [01-VISAO-GERAL.md](./01-VISAO-GERAL.md) | Introdução à plataforma Layers e conceitos fundamentais |
| [02-CONFIGURACAO-LIB.md](./02-CONFIGURACAO-LIB.md) | Como configurar e instalar a biblioteca LayersPortal.js |
| [03-REFERENCIA-API.md](./03-REFERENCIA-API.md) | Referência completa de eventos, propriedades e métodos |
| [04-AUTENTICACAO-SSO.md](./04-AUTENTICACAO-SSO.md) | Autenticação, validação de sessão e OAuth2 |
| [05-EXEMPLOS-PRATICOS.md](./05-EXEMPLOS-PRATICOS.md) | Exemplos de código para diversos cenários |
| [06-SERVICOS-RELACIONADOS.md](./06-SERVICOS-RELACIONADOS.md) | Serviços complementares (Notificações, API Hub, etc.) |

## Quick Start

### 1. Configurar o LayersPortal

```html
<script>
  window.LayersPortalOptions = {
    appId: "seu-app-id",
    insidePortalOnly: true
  };
</script>
<script src="https://js.layers.digital/v1/LayersPortal.js"></script>
```

### 2. Aguardar Conexão

```javascript
LayersPortal.on("connected", function(data) {
  console.log("Usuário:", data.userId);
  console.log("Comunidade:", data.communityId);
  // Iniciar sua aplicação
});
```

### 3. Validar Sessão no Backend

```bash
curl -X GET \
  "https://api.layers.digital/v1/sso/session/validate?session=SESSION&community=COMMUNITY&userId=USER_ID" \
  -H "Authorization: Bearer SEU_TOKEN"
```

## Propriedades Disponíveis

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `session` | String | Token de sessão |
| `userId` | String | ID do usuário |
| `communityId` | String | ID da comunidade |
| `accountId` | String | ID da conta |
| `platform` | String | "iframe", "ios", "android" ou null |
| `preferredLanguages` | Array | Idiomas preferidos |

## Métodos Disponíveis

| Método | Descrição |
|--------|-----------|
| `ready()` | Sinaliza fim do loading manual |
| `update(options)` | Atualiza URL/título do portal |
| `go(options)` | Navega para outro portal/página |
| `close()` | Fecha o portal |
| `download(options)` | Baixa arquivo para o dispositivo |
| `startGeolocation(options)` | Inicia coleta de localização |
| `stopGeolocation()` | Para coleta de localização |

## Recursos

- **Developer Center**: https://developers.layers.education
- **Status**: https://status.layers.digital
- **Suporte**: suporte@layers.education

## Estrutura da Plataforma

```
┌─────────────────────────────────────────┐
│           Plataforma Layers             │
├─────────────────────────────────────────┤
│  Portais    │ SSO       │ API Hub       │
│  Sync Data  │ Notifica- │ Pagamentos    │
│             │ ções      │               │
└─────────────────────────────────────────┘
```

## Processo de Integração

1. **Primeiro Contato** - Validar alinhamento
2. **Acesso ao Developer Center** - Preencher formulário
3. **Desenvolvimento** - Implementar com suporte Discord
4. **Homologação** - Validação automatizada (notas A-F)
5. **Liberação** - Disponibilizar para instituições

---

*Documentação baseada em https://developers.layers.education/content/layers-portal/*
