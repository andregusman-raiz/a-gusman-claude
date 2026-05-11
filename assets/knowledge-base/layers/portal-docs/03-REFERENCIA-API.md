# Referência da API LayersPortal.js

## Índice

- [Eventos](#eventos)
- [Promises](#promises)
- [Propriedades](#propriedades)
- [Métodos](#métodos)

---

## Eventos

### ready

Disparado quando a biblioteca LayersPortal é carregada com sucesso, indicando que foi importada corretamente.

```javascript
LayersPortal.on("ready", function() {
  console.log("Biblioteca LayersPortal carregada");
  // A biblioteca foi importada, mas ainda não conectou à Layers
});
```

**Observação**: Neste ponto, as propriedades de conexão ainda não estão disponíveis.

---

### connected

Emitido quando a biblioteca se conecta à Layers, habilitando acesso às propriedades e métodos. Recebe um parâmetro `data` contendo informações do usuário e sessão.

```javascript
LayersPortal.on("connected", function(data) {
  console.log("Conectado à Layers!");
  console.log("Dados recebidos:", data);

  // Agora você pode acessar:
  // - data.session
  // - data.userId
  // - data.communityId
  // - data.accountId
  // - data.preferredLanguages
});
```

**Estrutura do objeto `data`**:

```javascript
{
  session: "abc123...",              // ID da sessão
  userId: "user_12345",              // ID único do usuário na Layers
  communityId: "community_67890",    // ID da comunidade
  accountId: "account_11111",        // ID da conta do usuário
  preferredLanguages: ["pt-BR", "en"] // Idiomas preferidos
}
```

---

## Promises

### readyPromise

Resolve quando a biblioteca é importada com sucesso.

```javascript
// Usando then
LayersPortal.readyPromise.then(function() {
  console.log("Biblioteca pronta");
});

// Usando async/await
async function aguardarBiblioteca() {
  await LayersPortal.readyPromise;
  console.log("Biblioteca pronta");
}
```

---

### connectedPromise

Resolve quando a conexão com a Layers é estabelecida. Retorna informações da sessão e usuário.

```javascript
// Usando then
LayersPortal.connectedPromise.then(function(data) {
  console.log("Conectado!", data);
});

// Usando async/await
async function iniciar() {
  const data = await LayersPortal.connectedPromise;
  console.log("Usuário:", data.userId);
  console.log("Comunidade:", data.communityId);
}
```

---

## Propriedades

### ready

Indica se a biblioteca foi importada.

| Tipo | Descrição |
|------|-----------|
| `Boolean` | `true` se a biblioteca foi carregada, `false` caso contrário |

```javascript
if (LayersPortal.ready) {
  console.log("Biblioteca carregada");
}
```

---

### connected

Indica se está conectado à Layers.

| Tipo | Descrição |
|------|-----------|
| `Boolean` | `true` se conectado, `false` caso contrário |

```javascript
if (LayersPortal.connected) {
  console.log("Conectado à Layers");
} else {
  console.log("Aguardando conexão...");
}
```

---

### platform

Identifica a plataforma onde o portal está sendo executado.

| Tipo | Valores Possíveis |
|------|-------------------|
| `String` ou `null` | `"iframe"`, `"ios"`, `"android"`, ou `null` |

```javascript
switch (LayersPortal.platform) {
  case "iframe":
    console.log("Web (navegador)");
    break;
  case "ios":
    console.log("Dispositivo iOS");
    break;
  case "android":
    console.log("Dispositivo Android");
    break;
  default:
    console.log("Fora da Layers");
}
```

---

### session

Identificador da sessão atual.

| Tipo | Descrição |
|------|-----------|
| `String` | Token de sessão para validação |

```javascript
LayersPortal.on("connected", function() {
  console.log("Sessão:", LayersPortal.session);
});
```

---

### userId

Identificador único do usuário na Layers.

| Tipo | Descrição |
|------|-----------|
| `String` | ID único do usuário |

```javascript
LayersPortal.on("connected", function() {
  console.log("ID do usuário:", LayersPortal.userId);
});
```

---

### communityId

Identificador da comunidade onde o portal está sendo acessado.

| Tipo | Descrição |
|------|-----------|
| `String` | ID da comunidade |

```javascript
LayersPortal.on("connected", function() {
  console.log("Comunidade:", LayersPortal.communityId);
});
```

---

### accountId

Identificador da conta do usuário.

| Tipo | Descrição |
|------|-----------|
| `String` | ID da conta |

```javascript
LayersPortal.on("connected", function() {
  console.log("Conta:", LayersPortal.accountId);
});
```

---

### preferredLanguages

Array com os idiomas preferidos do usuário.

| Tipo | Descrição |
|------|-----------|
| `Array<String>` | Lista de códigos de idioma (ex: `["pt-BR", "en"]`) |

```javascript
LayersPortal.on("connected", function() {
  const idioma = LayersPortal.preferredLanguages[0];
  console.log("Idioma preferido:", idioma);

  // Configurar internacionalização
  i18n.setLocale(idioma);
});
```

---

## Métodos

### ready()

Sinaliza que o carregamento manual foi concluído. Requer a feature `manually-control-loading`.

**Sintaxe**:
```javascript
LayersPortal("ready");
```

**Exemplo de uso**:
```javascript
// Configuração com controle manual de loading
window.LayersPortalOptions = {
  appId: "meu-app",
  insidePortalOnly: true,
  features: ["manually-control-loading"]
};

// No código
LayersPortal.on("connected", async function() {
  // Carregar dados necessários
  await carregarDadosIniciais();
  await carregarConfiguracoes();

  // Remover loading screen
  LayersPortal("ready");
});
```

---

### update(options)

Atualiza a URL e/ou título do portal.

**Sintaxe**:
```javascript
LayersPortal("update", {
  url: String,    // opcional
  title: String   // opcional
});
```

**Parâmetros**:

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `url` | `String` | Não | Nova URL do portal |
| `title` | `String` | Não | Novo título do portal |

**Exemplos**:
```javascript
// Atualizar apenas o título
LayersPortal("update", {
  title: "Nova Página"
});

// Atualizar URL e título
LayersPortal("update", {
  url: "/pagina/detalhes/123",
  title: "Detalhes do Item"
});

// Atualizar apenas a URL
LayersPortal("update", {
  url: "/outra-pagina"
});
```

---

### go(options)

Redireciona para outro portal ou página da Layers.

**Sintaxe**:
```javascript
LayersPortal("go", {
  // Opções de navegação
});
```

**Exemplo**:
```javascript
// Navegar para outro portal
LayersPortal("go", {
  portal: "outro-portal-id",
  path: "/pagina-especifica"
});
```

---

### close()

Fecha o portal atual.

**Sintaxe**:
```javascript
LayersPortal("close");
```

**Exemplo**:
```javascript
// Botão para fechar o portal
document.getElementById("btnFechar").addEventListener("click", function() {
  LayersPortal("close");
});
```

---

### download(options)

Faz download de um arquivo para o dispositivo do usuário.

**Sintaxe**:
```javascript
await LayersPortal("download", {
  url: String,       // URL do arquivo
  filename: String   // Nome do arquivo com extensão
});
```

**Parâmetros**:

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `url` | `String` | Sim | URL do arquivo a ser baixado |
| `filename` | `String` | Sim | Nome do arquivo (incluindo extensão) |

**Exemplos**:
```javascript
// Download de PDF
await LayersPortal("download", {
  url: "https://meuservidor.com/relatorio.pdf",
  filename: "relatorio-mensal.pdf"
});

// Download de imagem
await LayersPortal("download", {
  url: "https://meuservidor.com/foto.jpg",
  filename: "foto-perfil.jpg"
});

// Download com tratamento de erro
try {
  await LayersPortal("download", {
    url: urlDoArquivo,
    filename: "documento.pdf"
  });
  console.log("Download concluído!");
} catch (error) {
  console.error("Erro no download:", error);
}
```

---

### startGeolocation(options)

Inicia a coleta de localização do usuário em intervalos regulares.

**Sintaxe**:
```javascript
await LayersPortal("startGeolocation", {
  interval: Number,   // Intervalo em milissegundos (5000-60000)
  duration: Number    // Duração total em milissegundos (até 1 hora)
});
```

**Parâmetros**:

| Parâmetro | Tipo | Obrigatório | Limites | Descrição |
|-----------|------|-------------|---------|-----------|
| `interval` | `Number` | Sim | 5000-60000 ms (5-60 segundos) | Intervalo entre coletas |
| `duration` | `Number` | Sim | Até 3600000 ms (1 hora) | Duração total da coleta |

**Exemplos**:
```javascript
// Coletar localização a cada 10 segundos por 5 minutos
await LayersPortal("startGeolocation", {
  interval: 10000,   // 10 segundos
  duration: 300000   // 5 minutos
});

// Coletar a cada 30 segundos por 1 hora
await LayersPortal("startGeolocation", {
  interval: 30000,   // 30 segundos
  duration: 3600000  // 1 hora
});
```

---

### stopGeolocation()

Interrompe a coleta de localização antes do término da duração definida.

**Sintaxe**:
```javascript
await LayersPortal("stopGeolocation");
```

**Exemplo**:
```javascript
// Iniciar coleta
await LayersPortal("startGeolocation", {
  interval: 10000,
  duration: 600000
});

// Parar coleta antecipadamente (ex: usuário clicou em botão)
document.getElementById("btnPararLocalizacao").addEventListener("click", async function() {
  await LayersPortal("stopGeolocation");
  console.log("Coleta de localização interrompida");
});
```

---

## Resumo Rápido

### Propriedades Disponíveis

| Propriedade | Tipo | Disponível após |
|-------------|------|-----------------|
| `ready` | Boolean | Carregamento da lib |
| `connected` | Boolean | Carregamento da lib |
| `platform` | String/null | Carregamento da lib |
| `session` | String | Conexão |
| `userId` | String | Conexão |
| `communityId` | String | Conexão |
| `accountId` | String | Conexão |
| `preferredLanguages` | Array | Conexão |

### Métodos Disponíveis

| Método | Descrição |
|--------|-----------|
| `ready()` | Sinaliza fim do loading manual |
| `update(options)` | Atualiza URL/título |
| `go(options)` | Navega para outro portal/página |
| `close()` | Fecha o portal |
| `download(options)` | Baixa arquivo |
| `startGeolocation(options)` | Inicia coleta de localização |
| `stopGeolocation()` | Para coleta de localização |

---

## Próximo Passo

Veja [Autenticação e SSO](./04-AUTENTICACAO-SSO.md) para aprender como validar sessões e implementar autenticação.
