# Layers Education — Data Sync (Sincronizacao de Dados)

> Base URL: `https://api.layers.digital`

---

## Visao Geral

O produto de sincronizacao de dados da Layers permite integracao de sistemas para importacao e exportacao de dados. O servico fornece dados normalizados acessiveis a varias aplicacoes, criando uma rede dinamica de conexoes.

### Dois Modelos Primarios
1. **Data Import** — Trazer informacoes de sistemas externos para a Layers
2. **Data Export** — Distribuir dados normalizados da Layers para empresas parceiras integradas

---

## Entidades Integradas

Quatro categorias primarias de dados sao sincronizadas:
- **Usuarios** (Users)
- **Alunos/Membros** (Members)
- **Turmas/Grupos** (Groups)
- **Disciplinas/Componentes** (Components)

---

## Tipos de Sincronizacao

### Sincronizacao Incremental

Busca apenas entidades modificadas recentemente, otimizando banda e processamento. Importa todos os dados e atualiza apenas os modificados desde a ultima sincronizacao.

**Endpoints de referencia:**
- Usuarios atualizados
- Membros atualizados
- Grupos atualizados
- Componentes atualizados

**Fluxo:** Layers faz 5 requisicoes ao sistema integrado:
1. Chamada de check (verificar operacionalidade)
2. Chamada para usuarios atualizados
3. Chamada para membros atualizados
4. Chamada para grupos atualizados
5. Chamada para componentes atualizados

### Sincronizacao Total

Abordagem abrangente com sincronizacoes totais em intervalos diarios. Recomendada quando frequencia diaria e aceitavel e volume de dados e gerenciavel.

**Endpoint de referencia:**
- Preparar para sincronizacao

**Fluxo:**
1. Chamada de check
2. Notificacao de preparo (prepare)
3. O provedor processa e envia dados de sync em ate 30 minutos

---

## Fluxo de Integracao

### 1. Solicitacao e Contato Inicial
Enviar interesse de integracao para `suporte@layers.education`. A equipe de integracao agenda conversa de avaliacao inicial.

### 2. Liberacao de Acesso
Preencher formulario fornecido. A Layers entrega:
- Acesso ao ambiente de desenvolvimento
- Identificadores
- Chaves de integracao

### 3. Desenvolvimento da Integracao

**Rota de Conexao:** Vincula sistemas do cliente respeitando metodos de autenticacao existentes.

**Rota de Check:** Primeira rota para verificar a operacionalidade do sistema integrado antes de iniciar a sincronizacao.

**Rotas de Entidades:**
- **Incremental:** 5 requisicoes da Layers — check + 4 chamadas de entidade
- **Total:** Check + notificacao de preparo; provedor processa e envia dentro de 30min

### 4. Homologacao e Certificacao
Checklist automatizado verifica seguranca, confiabilidade e experiencia do cliente. Certificacao garante consistencia e confiabilidade.

---

## Tratamento de Erros

### Error 401 — Nao Autorizado / Comunidade Nao Autenticada

**Trigger:** Quando um secret invalido e fornecido na requisicao.

**Response:**
```json
{
  "status": 401,
  "error": "Nao autorizado",
  "message": "A comunidade especificada nao possui as credenciais necessarias para acessar a Layers."
}
```

O app provedor deve responder com 401 se o secret transmitido difere do configurado durante a criacao do app.

### Error 404 — Comunidade Nao Encontrada

**Trigger:** Quando o identificador da comunidade enviado nao e reconhecido.

**Response:**
```json
{
  "status": 404,
  "error": "Comunidade nao encontrada",
  "message": "A comunidade especificada nao foi identificada nos parametros."
}
```

O app provedor deve retornar 404 se o parametro community nao corresponde a nenhum cliente valido configurado.

---

## Verificacao de Status da Integracao

Endpoint disponivel para verificar o status/saude da integracao e confirmar que os processos de sincronizacao funcionam corretamente.

---

## Monitoramento

- A Layers monitora a saude da integracao
- Aplica verificacoes periodicas de homologacao
- Fornece acesso ao monitoramento de dados de sync para clientes

---

## Notas Importantes

- Sincronizacao incremental minimiza requisicoes desnecessarias e custos
- Sincronizacao total requer preparacao antes da execucao
- O provedor e responsavel por implementar os handlers de erro corretos
- Ambas abordagens suportam as 4 entidades primarias
- Seguranca: validar o `secret` em cada requisicao recebida
