# Exemplos Práticos - Layers Portal

## Índice

1. [Portal Básico](#1-portal-básico)
2. [Portal com Autenticação Backend](#2-portal-com-autenticação-backend)
3. [Navegação Multi-Página](#3-navegação-multi-página)
4. [Download de Arquivos](#4-download-de-arquivos)
5. [Geolocalização](#5-geolocalização)
6. [Portal Multi-Idioma](#6-portal-multi-idioma)
7. [Integração com React](#7-integração-com-react)
8. [Integração com Vue.js](#8-integração-com-vuejs)

---

## 1. Portal Básico

O exemplo mais simples de um portal Layers.

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
      appId: "meu-app-basico",
      insidePortalOnly: true
    };
  </script>
  <script src="https://js.layers.digital/v1/LayersPortal.js"></script>

  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      margin: 0;
    }
    .loading {
      text-align: center;
      padding: 50px;
    }
    .content {
      display: none;
    }
    .user-info {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div id="loading" class="loading">
    <p>Conectando ao Layers...</p>
  </div>

  <div id="content" class="content">
    <div class="user-info">
      <h2>Bem-vindo!</h2>
      <p><strong>Usuário:</strong> <span id="userId"></span></p>
      <p><strong>Comunidade:</strong> <span id="communityId"></span></p>
      <p><strong>Plataforma:</strong> <span id="platform"></span></p>
    </div>

    <h3>Seu conteúdo aqui</h3>
    <p>Este é um portal básico integrado ao Layers.</p>
  </div>

  <script>
    LayersPortal.on("connected", function(data) {
      // Preencher informações do usuário
      document.getElementById("userId").textContent = data.userId;
      document.getElementById("communityId").textContent = data.communityId;
      document.getElementById("platform").textContent = LayersPortal.platform || "Desconhecida";

      // Mostrar conteúdo
      document.getElementById("loading").style.display = "none";
      document.getElementById("content").style.display = "block";
    });
  </script>
</body>
</html>
```

---

## 2. Portal com Autenticação Backend

Portal completo com validação de sessão no servidor.

### Frontend (index.html)

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portal Autenticado</title>

  <script>
    window.LayersPortalOptions = {
      appId: "portal-autenticado",
      insidePortalOnly: true
    };
  </script>
  <script src="https://js.layers.digital/v1/LayersPortal.js"></script>

  <style>
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .status { padding: 10px; border-radius: 4px; margin: 10px 0; }
    .success { background: #d4edda; color: #155724; }
    .error { background: #f8d7da; color: #721c24; }
    .loading { background: #fff3cd; color: #856404; }
  </style>
</head>
<body>
  <div class="container">
    <div id="status" class="status loading">
      Autenticando...
    </div>
    <div id="app"></div>
  </div>

  <script>
    const statusEl = document.getElementById("status");
    const appEl = document.getElementById("app");

    async function autenticar() {
      try {
        // Aguardar conexão com Layers
        const data = await LayersPortal.connectedPromise;

        statusEl.textContent = "Validando sessão...";

        // Validar no backend
        const response = await fetch("/api/auth/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session: data.session,
            communityId: data.communityId,
            userId: data.userId,
            accountId: data.accountId
          })
        });

        const result = await response.json();

        if (result.valid) {
          statusEl.className = "status success";
          statusEl.textContent = "Autenticado com sucesso!";

          // Carregar aplicação
          carregarApp(result.user);
        } else {
          throw new Error(result.error || "Sessão inválida");
        }
      } catch (error) {
        statusEl.className = "status error";
        statusEl.textContent = "Erro: " + error.message;
      }
    }

    function carregarApp(user) {
      appEl.innerHTML = `
        <h2>Olá, ${user.name}!</h2>
        <p>Email: ${user.email}</p>
        <p>Perfil: ${user.role}</p>
        <!-- Resto da aplicação -->
      `;
    }

    autenticar();
  </script>
</body>
</html>
```

### Backend (Node.js/Express)

```javascript
// server.js
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Validar sessão Layers
app.post('/api/auth/validate', async (req, res) => {
  const { session, communityId, userId, accountId } = req.body;

  try {
    // Validar com API Layers
    const layersResponse = await axios.get(
      'https://api.layers.digital/v1/sso/session/validate',
      {
        params: {
          session,
          community: communityId,
          userId
        },
        headers: {
          'Authorization': `Bearer ${process.env.LAYERS_TOKEN}`
        }
      }
    );

    if (layersResponse.data.valid) {
      // Buscar/criar usuário no banco
      const user = await findOrCreateUser({
        layersUserId: userId,
        layersCommunityId: communityId,
        layersAccountId: accountId
      });

      res.json({
        valid: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      res.status(401).json({ valid: false, error: 'Sessão inválida' });
    }
  } catch (error) {
    console.error('Erro de validação:', error);
    res.status(500).json({ valid: false, error: 'Erro interno' });
  }
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
```

---

## 3. Navegação Multi-Página

Gerenciando navegação e atualizando título/URL.

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Portal Multi-Página</title>

  <script>
    window.LayersPortalOptions = {
      appId: "portal-multipagina",
      insidePortalOnly: true
    };
  </script>
  <script src="https://js.layers.digital/v1/LayersPortal.js"></script>

  <style>
    nav { background: #333; padding: 10px; }
    nav button {
      background: #555;
      color: white;
      border: none;
      padding: 10px 20px;
      margin-right: 5px;
      cursor: pointer;
    }
    nav button.active { background: #007bff; }
    .page { padding: 20px; display: none; }
    .page.active { display: block; }
  </style>
</head>
<body>
  <nav>
    <button onclick="irPara('home')" id="btn-home" class="active">Início</button>
    <button onclick="irPara('lista')" id="btn-lista">Lista</button>
    <button onclick="irPara('config')" id="btn-config">Configurações</button>
    <button onclick="fecharPortal()">Fechar</button>
  </nav>

  <div id="home" class="page active">
    <h1>Página Inicial</h1>
    <p>Bem-vindo ao portal!</p>
  </div>

  <div id="lista" class="page">
    <h1>Lista de Itens</h1>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </ul>
  </div>

  <div id="config" class="page">
    <h1>Configurações</h1>
    <p>Ajuste suas preferências aqui.</p>
  </div>

  <script>
    const paginas = {
      home: { titulo: "Início", url: "/" },
      lista: { titulo: "Lista de Itens", url: "/lista" },
      config: { titulo: "Configurações", url: "/configuracoes" }
    };

    let paginaAtual = "home";

    function irPara(pagina) {
      // Esconder página atual
      document.getElementById(paginaAtual).classList.remove("active");
      document.getElementById("btn-" + paginaAtual).classList.remove("active");

      // Mostrar nova página
      document.getElementById(pagina).classList.add("active");
      document.getElementById("btn-" + pagina).classList.add("active");

      paginaAtual = pagina;

      // Atualizar título e URL no Layers
      LayersPortal("update", {
        title: paginas[pagina].titulo,
        url: paginas[pagina].url
      });
    }

    function fecharPortal() {
      if (confirm("Deseja fechar o portal?")) {
        LayersPortal("close");
      }
    }
  </script>
</body>
</html>
```

---

## 4. Download de Arquivos

Gerenciando downloads de arquivos no portal.

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Portal de Downloads</title>

  <script>
    window.LayersPortalOptions = {
      appId: "portal-downloads",
      insidePortalOnly: true
    };
  </script>
  <script src="https://js.layers.digital/v1/LayersPortal.js"></script>

  <style>
    .file-list { list-style: none; padding: 0; }
    .file-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      border: 1px solid #ddd;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    .download-btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 8px 16px;
      cursor: pointer;
      border-radius: 4px;
    }
    .download-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .status { font-size: 0.9em; color: #666; }
  </style>
</head>
<body>
  <h1>Arquivos Disponíveis</h1>

  <ul class="file-list" id="fileList">
    <!-- Preenchido dinamicamente -->
  </ul>

  <script>
    const arquivos = [
      {
        nome: "Relatório Mensal.pdf",
        url: "https://exemplo.com/relatorios/mensal.pdf",
        tamanho: "2.5 MB"
      },
      {
        nome: "Planilha de Dados.xlsx",
        url: "https://exemplo.com/planilhas/dados.xlsx",
        tamanho: "1.2 MB"
      },
      {
        nome: "Apresentação.pptx",
        url: "https://exemplo.com/apresentacoes/slides.pptx",
        tamanho: "5.8 MB"
      }
    ];

    LayersPortal.on("connected", function() {
      renderizarArquivos();
    });

    function renderizarArquivos() {
      const lista = document.getElementById("fileList");

      lista.innerHTML = arquivos.map((arquivo, index) => `
        <li class="file-item">
          <div>
            <strong>${arquivo.nome}</strong>
            <div class="status">Tamanho: ${arquivo.tamanho}</div>
            <div class="status" id="status-${index}"></div>
          </div>
          <button
            class="download-btn"
            id="btn-${index}"
            onclick="baixarArquivo(${index})"
          >
            Baixar
          </button>
        </li>
      `).join("");
    }

    async function baixarArquivo(index) {
      const arquivo = arquivos[index];
      const btn = document.getElementById("btn-" + index);
      const status = document.getElementById("status-" + index);

      btn.disabled = true;
      btn.textContent = "Baixando...";
      status.textContent = "Preparando download...";

      try {
        await LayersPortal("download", {
          url: arquivo.url,
          filename: arquivo.nome
        });

        status.textContent = "Download concluído!";
        status.style.color = "green";
      } catch (error) {
        status.textContent = "Erro no download: " + error.message;
        status.style.color = "red";
      } finally {
        btn.disabled = false;
        btn.textContent = "Baixar";
      }
    }
  </script>
</body>
</html>
```

---

## 5. Geolocalização

Coletando localização do usuário para check-in/presença.

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Check-in com Localização</title>

  <script>
    window.LayersPortalOptions = {
      appId: "portal-geolocalizacao",
      insidePortalOnly: true
    };
  </script>
  <script src="https://js.layers.digital/v1/LayersPortal.js"></script>

  <style>
    .container { max-width: 400px; margin: 0 auto; padding: 20px; }
    .btn {
      width: 100%;
      padding: 15px;
      font-size: 18px;
      cursor: pointer;
      border: none;
      border-radius: 8px;
      margin: 10px 0;
    }
    .btn-start { background: #28a745; color: white; }
    .btn-stop { background: #dc3545; color: white; }
    .btn:disabled { background: #ccc; cursor: not-allowed; }
    .status-box {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .active { background: #d4edda; border: 1px solid #28a745; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Check-in de Presença</h1>

    <div class="status-box" id="statusBox">
      <p><strong>Status:</strong> <span id="status">Aguardando</span></p>
      <p><strong>Tempo restante:</strong> <span id="tempoRestante">--</span></p>
    </div>

    <button class="btn btn-start" id="btnIniciar" onclick="iniciarCheckin()">
      Iniciar Check-in
    </button>

    <button class="btn btn-stop" id="btnParar" onclick="pararCheckin()" style="display: none;">
      Encerrar Check-in
    </button>

    <div id="historico">
      <h3>Histórico</h3>
      <ul id="listaHistorico"></ul>
    </div>
  </div>

  <script>
    let intervalo;
    let tempoFim;

    LayersPortal.on("connected", function() {
      document.getElementById("status").textContent = "Pronto";
    });

    async function iniciarCheckin() {
      const btnIniciar = document.getElementById("btnIniciar");
      const btnParar = document.getElementById("btnParar");
      const statusBox = document.getElementById("statusBox");

      try {
        // Configuração: coleta a cada 30 segundos por 10 minutos
        await LayersPortal("startGeolocation", {
          interval: 30000,   // 30 segundos
          duration: 600000   // 10 minutos
        });

        btnIniciar.style.display = "none";
        btnParar.style.display = "block";
        statusBox.classList.add("active");
        document.getElementById("status").textContent = "Coletando localização...";

        // Iniciar contador
        tempoFim = Date.now() + 600000;
        intervalo = setInterval(atualizarContador, 1000);

        adicionarHistorico("Check-in iniciado");

      } catch (error) {
        alert("Erro ao iniciar: " + error.message);
      }
    }

    async function pararCheckin() {
      const btnIniciar = document.getElementById("btnIniciar");
      const btnParar = document.getElementById("btnParar");
      const statusBox = document.getElementById("statusBox");

      try {
        await LayersPortal("stopGeolocation");

        btnIniciar.style.display = "block";
        btnParar.style.display = "none";
        statusBox.classList.remove("active");
        document.getElementById("status").textContent = "Encerrado";
        document.getElementById("tempoRestante").textContent = "--";

        clearInterval(intervalo);
        adicionarHistorico("Check-in encerrado");

      } catch (error) {
        alert("Erro ao parar: " + error.message);
      }
    }

    function atualizarContador() {
      const restante = tempoFim - Date.now();

      if (restante <= 0) {
        clearInterval(intervalo);
        document.getElementById("tempoRestante").textContent = "Concluído";
        document.getElementById("btnIniciar").style.display = "block";
        document.getElementById("btnParar").style.display = "none";
        adicionarHistorico("Check-in concluído automaticamente");
        return;
      }

      const minutos = Math.floor(restante / 60000);
      const segundos = Math.floor((restante % 60000) / 1000);
      document.getElementById("tempoRestante").textContent =
        `${minutos}:${segundos.toString().padStart(2, "0")}`;
    }

    function adicionarHistorico(mensagem) {
      const lista = document.getElementById("listaHistorico");
      const item = document.createElement("li");
      const hora = new Date().toLocaleTimeString();
      item.textContent = `[${hora}] ${mensagem}`;
      lista.insertBefore(item, lista.firstChild);
    }
  </script>
</body>
</html>
```

---

## 6. Portal Multi-Idioma

Suporte a múltiplos idiomas baseado nas preferências do usuário.

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Portal Multi-Idioma</title>

  <script>
    window.LayersPortalOptions = {
      appId: "portal-i18n",
      insidePortalOnly: true
    };
  </script>
  <script src="https://js.layers.digital/v1/LayersPortal.js"></script>
</head>
<body>
  <div id="app">
    <h1 id="titulo"></h1>
    <p id="boasVindas"></p>
    <button id="btnAcao"></button>
  </div>

  <script>
    // Traduções
    const traducoes = {
      "pt-BR": {
        titulo: "Bem-vindo ao Portal",
        boasVindas: "Olá! Como podemos ajudar você hoje?",
        btnAcao: "Começar"
      },
      "en": {
        titulo: "Welcome to the Portal",
        boasVindas: "Hello! How can we help you today?",
        btnAcao: "Get Started"
      },
      "es": {
        titulo: "Bienvenido al Portal",
        boasVindas: "¡Hola! ¿Cómo podemos ayudarte hoy?",
        btnAcao: "Comenzar"
      }
    };

    // Idioma padrão
    const idiomaPadrao = "pt-BR";

    LayersPortal.on("connected", function() {
      // Obter idiomas preferidos do usuário
      const idiomas = LayersPortal.preferredLanguages || [];

      // Encontrar primeiro idioma suportado
      let idiomaEscolhido = idiomaPadrao;
      for (const idioma of idiomas) {
        if (traducoes[idioma]) {
          idiomaEscolhido = idioma;
          break;
        }
        // Tentar variante (ex: "pt" para "pt-BR")
        const codigoBase = idioma.split("-")[0];
        const varianteEncontrada = Object.keys(traducoes).find(
          t => t.startsWith(codigoBase)
        );
        if (varianteEncontrada) {
          idiomaEscolhido = varianteEncontrada;
          break;
        }
      }

      // Aplicar traduções
      aplicarTraducoes(idiomaEscolhido);
    });

    function aplicarTraducoes(idioma) {
      const t = traducoes[idioma];

      document.getElementById("titulo").textContent = t.titulo;
      document.getElementById("boasVindas").textContent = t.boasVindas;
      document.getElementById("btnAcao").textContent = t.btnAcao;

      // Atualizar atributo lang
      document.documentElement.lang = idioma;

      console.log("Idioma aplicado:", idioma);
    }
  </script>
</body>
</html>
```

---

## 7. Integração com React

Exemplo de integração com React.

### LayersPortalContext.jsx

```jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const LayersPortalContext = createContext(null);

export function LayersPortalProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar se LayersPortal existe
    if (typeof window.LayersPortal === 'undefined') {
      setError('LayersPortal não carregado');
      setLoading(false);
      return;
    }

    // Aguardar conexão
    window.LayersPortal.on('connected', (data) => {
      setUserData({
        session: data.session,
        userId: data.userId,
        communityId: data.communityId,
        accountId: data.accountId,
        preferredLanguages: data.preferredLanguages,
        platform: window.LayersPortal.platform
      });
      setConnected(true);
      setLoading(false);
    });

    // Timeout de segurança
    const timeout = setTimeout(() => {
      if (!connected) {
        setError('Timeout ao conectar com Layers');
        setLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, []);

  const value = {
    connected,
    userData,
    loading,
    error,
    // Métodos wrapper
    updatePortal: (options) => window.LayersPortal('update', options),
    closePortal: () => window.LayersPortal('close'),
    downloadFile: (options) => window.LayersPortal('download', options),
    startGeolocation: (options) => window.LayersPortal('startGeolocation', options),
    stopGeolocation: () => window.LayersPortal('stopGeolocation')
  };

  return (
    <LayersPortalContext.Provider value={value}>
      {children}
    </LayersPortalContext.Provider>
  );
}

export function useLayersPortal() {
  const context = useContext(LayersPortalContext);
  if (!context) {
    throw new Error('useLayersPortal deve ser usado dentro de LayersPortalProvider');
  }
  return context;
}
```

### App.jsx

```jsx
import React from 'react';
import { LayersPortalProvider, useLayersPortal } from './LayersPortalContext';

function PortalContent() {
  const { connected, userData, loading, error, updatePortal, closePortal } = useLayersPortal();

  if (loading) {
    return <div className="loading">Conectando ao Layers...</div>;
  }

  if (error) {
    return <div className="error">Erro: {error}</div>;
  }

  if (!connected) {
    return <div className="error">Não conectado</div>;
  }

  return (
    <div className="app">
      <header>
        <h1>Meu Portal React</h1>
        <button onClick={closePortal}>Fechar</button>
      </header>

      <main>
        <div className="user-info">
          <h2>Informações do Usuário</h2>
          <p>ID: {userData.userId}</p>
          <p>Comunidade: {userData.communityId}</p>
          <p>Plataforma: {userData.platform}</p>
        </div>

        <button onClick={() => updatePortal({ title: 'Nova Página' })}>
          Atualizar Título
        </button>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <LayersPortalProvider>
      <PortalContent />
    </LayersPortalProvider>
  );
}
```

---

## 8. Integração com Vue.js

Exemplo de integração com Vue 3.

### useLayersPortal.js (Composable)

```javascript
import { ref, onMounted, onUnmounted } from 'vue';

export function useLayersPortal() {
  const connected = ref(false);
  const loading = ref(true);
  const error = ref(null);
  const userData = ref(null);

  let timeout = null;

  onMounted(() => {
    if (typeof window.LayersPortal === 'undefined') {
      error.value = 'LayersPortal não carregado';
      loading.value = false;
      return;
    }

    window.LayersPortal.on('connected', (data) => {
      userData.value = {
        session: data.session,
        userId: data.userId,
        communityId: data.communityId,
        accountId: data.accountId,
        preferredLanguages: data.preferredLanguages,
        platform: window.LayersPortal.platform
      };
      connected.value = true;
      loading.value = false;
    });

    timeout = setTimeout(() => {
      if (!connected.value) {
        error.value = 'Timeout ao conectar';
        loading.value = false;
      }
    }, 10000);
  });

  onUnmounted(() => {
    if (timeout) clearTimeout(timeout);
  });

  // Métodos
  const updatePortal = (options) => {
    window.LayersPortal('update', options);
  };

  const closePortal = () => {
    window.LayersPortal('close');
  };

  const downloadFile = async (options) => {
    return await window.LayersPortal('download', options);
  };

  const startGeolocation = async (options) => {
    return await window.LayersPortal('startGeolocation', options);
  };

  const stopGeolocation = async () => {
    return await window.LayersPortal('stopGeolocation');
  };

  return {
    connected,
    loading,
    error,
    userData,
    updatePortal,
    closePortal,
    downloadFile,
    startGeolocation,
    stopGeolocation
  };
}
```

### App.vue

```vue
<template>
  <div class="app">
    <div v-if="loading" class="loading">
      Conectando ao Layers...
    </div>

    <div v-else-if="error" class="error">
      Erro: {{ error }}
    </div>

    <div v-else-if="connected" class="content">
      <header>
        <h1>Meu Portal Vue</h1>
        <button @click="closePortal">Fechar</button>
      </header>

      <main>
        <div class="user-info">
          <h2>Informações do Usuário</h2>
          <p><strong>ID:</strong> {{ userData.userId }}</p>
          <p><strong>Comunidade:</strong> {{ userData.communityId }}</p>
          <p><strong>Plataforma:</strong> {{ userData.platform }}</p>
        </div>

        <button @click="updatePortal({ title: 'Nova Página Vue' })">
          Atualizar Título
        </button>
      </main>
    </div>
  </div>
</template>

<script setup>
import { useLayersPortal } from './composables/useLayersPortal';

const {
  connected,
  loading,
  error,
  userData,
  updatePortal,
  closePortal
} = useLayersPortal();
</script>

<style scoped>
.app {
  font-family: Arial, sans-serif;
  padding: 20px;
}
.loading, .error {
  padding: 50px;
  text-align: center;
}
.error {
  color: #dc3545;
}
.user-info {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
}
</style>
```

---

## Dicas Gerais

1. **Sempre teste em todas as plataformas** (web, iOS, Android)
2. **Use async/await** para código mais limpo
3. **Trate erros adequadamente** em todas as operações
4. **Valide a sessão no backend** antes de operações sensíveis
5. **Use controle manual de loading** para melhor UX em carregamentos longos

---

## Recursos Adicionais

- [Visão Geral](./01-VISAO-GERAL.md)
- [Configuração da Biblioteca](./02-CONFIGURACAO-LIB.md)
- [Referência da API](./03-REFERENCIA-API.md)
- [Autenticação e SSO](./04-AUTENTICACAO-SSO.md)
- [Documentação Oficial](https://developers.layers.education/content/layers-portal/)
