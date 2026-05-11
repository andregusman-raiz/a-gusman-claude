# Configurando a Biblioteca LayersPortal.js

## Visão Geral

A biblioteca LayersPortal.js permite que apps registrados na plataforma Layers acessem informações da comunidade e funcionalidades de forma segura quando acessados através da Layers.

## Instalação

Para implementar a biblioteca, inclua o seguinte código na seção `<head>` do seu documento HTML:

```html
<!DOCTYPE html>
<html>
  <head>
    <script>
      window.LayersPortalOptions = {
        appId: "seu-app-id",
        insidePortalOnly: true
      };
    </script>
    <script
      type="text/javascript"
      src="https://js.layers.digital/v1/LayersPortal.js"
    ></script>
  </head>
  <body>
    <!-- Seu conteúdo aqui -->
  </body>
</html>
```

## Opções de Configuração

O objeto `LayersPortalOptions` aceita as seguintes propriedades:

### appId (obrigatório)
- **Tipo**: `String`
- **Descrição**: Identificador único do seu aplicativo na plataforma Layers
- **Exemplo**: `"meu-app-portal"`

### insidePortalOnly (obrigatório)
- **Tipo**: `Boolean`
- **Descrição**: Determina se a página deve ser acessível apenas através da plataforma Layers
- **Valores**:
  - `true`: Página só funciona dentro da Layers
  - `false`: Página pode ser acessada fora da Layers (standalone)

## Configuração Completa

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meu Portal Layers</title>

    <!-- Configuração do LayersPortal -->
    <script>
      window.LayersPortalOptions = {
        appId: "meu-app-id",
        insidePortalOnly: true
      };
    </script>

    <!-- Carregamento da biblioteca -->
    <script
      type="text/javascript"
      src="https://js.layers.digital/v1/LayersPortal.js"
    ></script>

    <!-- Seus estilos e scripts adicionais -->
  </head>
  <body>
    <div id="app">
      <!-- Conteúdo do portal -->
    </div>

    <script>
      // Aguardar conexão com Layers
      LayersPortal.on("connected", function(data) {
        console.log("Conectado à Layers!");
        console.log("Usuário:", data.userId);
        console.log("Comunidade:", data.communityId);

        // Iniciar sua aplicação
        iniciarApp(data);
      });

      function iniciarApp(userData) {
        // Sua lógica de inicialização
      }
    </script>
  </body>
</html>
```

## Fluxo de Carregamento

```
┌─────────────────────────────────────────────────────────────┐
│                   Página Carrega                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           LayersPortalOptions é definido                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           LayersPortal.js é carregado                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         Evento "ready" é disparado                           │
│         (biblioteca importada)                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         Evento "connected" é disparado                       │
│         (conectado à Layers com dados do usuário)           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         Aplicação pronta para uso                            │
└─────────────────────────────────────────────────────────────┘
```

## Verificando a Plataforma

Você pode verificar em qual plataforma o portal está sendo executado:

```javascript
LayersPortal.on("connected", function(data) {
  switch(LayersPortal.platform) {
    case "iframe":
      console.log("Executando em navegador web (iframe)");
      break;
    case "ios":
      console.log("Executando em dispositivo iOS");
      break;
    case "android":
      console.log("Executando em dispositivo Android");
      break;
    default:
      console.log("Executando fora da Layers");
  }
});
```

## Modo Standalone (insidePortalOnly: false)

Se configurar `insidePortalOnly: false`, sua aplicação pode funcionar fora da Layers:

```javascript
window.LayersPortalOptions = {
  appId: "meu-app-id",
  insidePortalOnly: false
};

// Verificar se está dentro da Layers
if (LayersPortal.platform) {
  // Dentro da Layers
  LayersPortal.on("connected", function(data) {
    iniciarComDadosLayers(data);
  });
} else {
  // Fora da Layers - usar autenticação própria
  iniciarModoStandalone();
}
```

## Boas Práticas

### 1. Sempre aguarde a conexão
```javascript
// ❌ Errado - dados podem não estar disponíveis
console.log(LayersPortal.userId);

// ✅ Correto - aguardar conexão
LayersPortal.on("connected", function() {
  console.log(LayersPortal.userId);
});
```

### 2. Use Promises para código assíncrono moderno
```javascript
// Usando async/await
async function iniciarApp() {
  const data = await LayersPortal.connectedPromise;
  console.log("Usuário:", data.userId);
  // Continuar inicialização
}

iniciarApp();
```

### 3. Trate erros de carregamento
```javascript
// Timeout para detectar falha de carregamento
const timeout = setTimeout(function() {
  console.error("Falha ao conectar com Layers");
  mostrarMensagemErro();
}, 10000);

LayersPortal.on("connected", function() {
  clearTimeout(timeout);
  // Continuar normalmente
});
```

## Recursos Adicionais

Para features avançadas como controle manual de loading, use a feature flag:

```javascript
window.LayersPortalOptions = {
  appId: "meu-app-id",
  insidePortalOnly: true,
  features: ["manually-control-loading"]
};
```

Isso permite controlar quando o loading é removido:

```javascript
LayersPortal.on("connected", async function() {
  // Carregar dados necessários
  await carregarDados();

  // Sinalizar que está pronto
  LayersPortal("ready");
});
```

## Próximo Passo

Veja a [Referência da API LayersPortal.js](./03-REFERENCIA-API.md) para conhecer todos os métodos e propriedades disponíveis.
