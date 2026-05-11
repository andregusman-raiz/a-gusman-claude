# Layers Portal - Visão Geral

## O que é a Layers?

Layers é uma plataforma unificada que centraliza soluções digitais para educação. Oferece um único login para todos os recursos no mesmo ambiente digital, atendendo mais de 600 instituições de ensino.

## O que são Portais?

A funcionalidade de **Portais** da Layers permite que apps adicionem telas personalizadas à interface da plataforma. Além disso, possibilita:

- Autenticação OAuth
- Integração com sistema de push notifications
- Acesso a dados do usuário e comunidade
- Execução em ambiente web e mobile (iOS/Android)

## Requisitos para Implementação

Para implementar um Portal, são necessários:

1. **App registrado** - O aplicativo deve estar cadastrado na plataforma Layers
2. **Funcionalidade "Portais" habilitada** - Deve ser ativada para o app
3. **URL da página** - Deve utilizar a biblioteca LayersPortal.js

## Arquitetura de Integração

```
┌─────────────────────────────────────────────────────────────┐
│                    Plataforma Layers                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Interface Layers                      ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │              Seu Portal (iframe/webview)            │││
│  │  │  ┌─────────────────────────────────────────────────┐│││
│  │  │  │           LayersPortal.js                       ││││
│  │  │  │  • Comunicação com Layers                       ││││
│  │  │  │  • Acesso a dados do usuário                    ││││
│  │  │  │  • Controle de navegação                        ││││
│  │  │  │  • Download de arquivos                         ││││
│  │  │  │  • Geolocalização                               ││││
│  │  │  └─────────────────────────────────────────────────┘│││
│  │  └─────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Camadas de Integração da Layers

A plataforma Layers oferece quatro funcionalidades principais:

### 1. Portais
Permite que seu app seja acessado dentro da Layers, tanto na versão web quanto mobile. Usuários podem acessar seu app sem sair do ambiente Layers.

### 2. Single Sign-On (SSO)
Dois modos de autenticação:
- **OAuth2**: Para cenários que requerem consentimento de escopo e Bearer tokens
- **Sessions (Portais)**: Para abrir/validar portais autenticados

### 3. Sincronização de Dados
Permite:
- Importar dados de sistemas externos para Layers
- Exportar dados normalizados para parceiros

### 4. API Hub
Comunicação estruturada entre apps através de:
- **Request & Respond**: Consultas síncronas para dados específicos
- **Publish & Subscribe**: Notificações assíncronas em tempo real

## Processo de Integração (5 Etapas)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Primeiro   │───▶│   Ganhando   │───▶│              │───▶│  Homologação │───▶│              │
│   Contato    │    │    Acesso    │    │Desenvolvimento│   │   Técnica    │    │  Liberação   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
       │                   │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼                   ▼
  Validar           Preencher            Implementar         Validação           Disponibilizar
  alinhamento       formulário           solução com         automatizada        para
  com Layers        Developer Center     suporte Discord     (notas A-F)         instituições
```

### Critérios de Aprovação

| Tipo de Liberação | Nota Mínima |
|-------------------|-------------|
| Não listada       | C           |
| Pública           | B ou superior |
| Retorno ao desenvolvimento | D ou F |

## Plataformas Suportadas

O portal pode ser executado em:

| Plataforma | Identificador |
|------------|---------------|
| Web (iframe) | `iframe` |
| iOS | `ios` |
| Android | `android` |

## Recursos Relacionados

- **Notificações**: Push e email com segmentação e agendamento
- **Apps Visualizadores**: 9 apps pré-construídos para visualização de dados
- **Pagamentos**: Gerenciamento de transações financeiras

## Links Úteis

- **Developer Center**: https://developers.layers.education
- **Status da Plataforma**: https://status.layers.digital
- **Acesso à Plataforma**: https://id.layers.digital
- **Suporte**: suporte@layers.education

## Próximos Passos

1. [Configurando a Biblioteca LayersPortal.js](./02-CONFIGURACAO-LIB.md)
2. [Referência da API LayersPortal.js](./03-REFERENCIA-API.md)
3. [Autenticação e SSO](./04-AUTENTICACAO-SSO.md)
4. [Exemplos Práticos](./05-EXEMPLOS-PRATICOS.md)
