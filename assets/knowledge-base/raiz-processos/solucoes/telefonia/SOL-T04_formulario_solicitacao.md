# SOL-T04 — Formulario Padrao de Solicitacao de Telefonia (Google Forms)

**Processo**: Gestao de Telefonia Corporativa
**Nivel**: N1 (config nativa — Google Forms + Sheets)
**Prioridade**: Quick Win
**Timeline**: 1 dia util
**Responsavel**: Kevin ou Samara (executa) | Aprovador: Maressa
**Resolve**: RC-T03 (pedidos a la carte / informais)

---

## Descricao

Criar formulario unico de solicitacao que capture todos os dados necessarios para avaliar e aprovar o pedido, eliminando solicitacoes informais. O formulario alimenta automaticamente uma aba de "Solicitacoes Pendentes" na planilha.

**Posicao na Matriz Impacto x Esforco**: Esforco BAIXO / Impacto ALTO — Quick Win

### ROI / Impacto Esperado

| Metrica | Antes | Depois (estimado) | Melhoria |
|---------|-------|-------------------|----------|
| Solicitacoes informais (sem ticket) | ~60% | < 10% | -83% |
| SLA de atendimento (10 dias uteis) | Sem controle | Monitorado | Baseline |

---

## Campos do Formulario

- Solicitante (nome, cargo, email)
- Unidade/Area
- Tipo de solicitacao: Kit completo / So chip / So aparelho / Troca / Cancelamento
- Justificativa da solicitacao
- Nome do beneficiario (se diferente do solicitante)
- Aprovador responsavel (gerente/diretor — conforme politica)
- Upload: aprovacao formal (email ou documento)

**Politica a incluir no cabecalho do formulario**:
> "Telefonia corporativa e recurso controlado. A solicitacao sera avaliada conforme disponibilidade de estoque e aprovacao da hierarquia (diretoria, gerencia, coordenacao sede, diretores/gerentes escolares). SLA de resposta: 10 dias uteis."

---

## Fluxo Apos Envio

1. Resposta automatica ao solicitante com numero de protocolo
2. Notificacao para Operacoes (email via Google Forms)
3. Operacoes valida aprovacao e disponibilidade de estoque
4. Operacoes agenda entrega e gera termo de responsabilidade
5. Apos entrega: atualiza planilha inventario

---

## Plano de Implementacao

### Pre-requisitos

- Conta Google Workspace da Raiz com permissao de criar formularios

### Plano Detalhado

| Atividade | Descricao |
|-----------|-----------|
| Criar formulario | Google Forms com campos: Solicitante (nome, cargo, email, unidade), Tipo de solicitacao (dropdown), Beneficiario, Justificativa, Aprovador responsavel, Upload aprovacao. |
| Configurar resposta automatica | Email de confirmacao com numero de protocolo (timestamp do envio) |
| Criar notificacao para Operacoes | Forms → notificar email operacoes ao receber resposta |
| Vincular ao Sheets | Respostas → aba "Solicitacoes_Pendentes" na planilha de inventario |
| Publicar e comunicar | Link fixo enviado para todos por email + fixado em canal relevante |

### Checklist de Validacao

- [ ] Formulario publicado e acessivel pelo link
- [ ] Resposta automatica chegando ao solicitante (testar)
- [ ] Notificacao chegando a Operacoes (testar)
- [ ] Respostas aparecendo na aba "Solicitacoes_Pendentes" da planilha
- [ ] Link comunicado para todos os colaboradores (email + canal de comunicacao interno)

---

## KPIs de Acompanhamento

| KPI | Baseline (hoje) | Meta Fase 1 | Meta Fase 2 | Meta Fase 3 |
|-----|----------------|-------------|-------------|-------------|
| % solicitacoes com ticket formal | ~10% | 80% | 95% | 100% |

---

## Contexto no Roadmap

**Fase 1 — Fundacao: Rastreabilidade (Semana 1)**

Independente, pode rodar em paralelo com SOL-T01, SOL-T02, SOL-T03. Pre-requisito para SOL-T05.

**Dependencias**:
```
SOL-T04 (formulario solicitacao) ← independente, prerequisito para SOL-T05
```
