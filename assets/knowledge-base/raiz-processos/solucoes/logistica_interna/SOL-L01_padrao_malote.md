# SOL-L01 — Padrao Fisico de Area de Malote nas Escolas (POP)

**Processo**: Logistica Interna (Malote + Frete + Motoboy) — Raiz Educacao
**Nivel**: N1 (processo/config operacional)
**Prioridade**: Quick Win
**Timeline**: 1-2 semanas (absorver no POP em andamento) | Prazo: Semanas 1-2
**Responsavel**: Maressa (autoria do POP) + Coordenacao de Escolas (execucao nas unidades)
**Resolve**: RC-L01

---

## Descricao

Criar padrao minimo de recepcao de malote para as escolas como parte do POP. Cada escola define um ponto fixo (mesa, armario, caixa identificada) para despacho e recepcao. Motorista so retira o que esta no ponto fixo — nao busca pela escola.

**Posicao na Matriz Impacto x Esforco**: Esforco BAIXO / Impacto ALTO — Quick Win

**Regra operacional proposta**:
> "Item nao esta no ponto fixo = nao foi coletado nessa viagem. Proxima coleta agendada."

Isso transfere a responsabilidade para a escola organizar antes da chegada do motorista, em vez de o motorista esperar.

### ROI / Impacto Esperado

| Solucao | Causa Raiz Resolvida | Impacto Esperado | Prazo |
|---------|---------------------|-----------------|-------|
| SOL-L01 (Padrao malote) | RC-L01 | Reducao de tempo ocioso motoristas em escolas; > 80% paradas dentro do tempo estimado | Semanas 1-2 |

---

## Pre-requisitos

- POP de malote em andamento (ja existe — incorporar secao de escola receptora)
- Canal de comunicacao com coordenadores/gestores das escolas atendidas

---

## Plano de Implementacao

| Semana | Atividade |
|--------|-----------|
| Semana 1, Dia 1-2 | Escrever secao "Responsabilidades da Escola Receptora" no POP |
| Semana 1, Dia 3 | Definir criterio minimo do ponto fixo: local identificado, acessivel sem acompanhamento, disponivel no horario de coleta |
| Semana 1, Dia 4 | Comunicar coordenadores de escolas com prazo de 15 dias para implementar ponto fixo |
| Semana 2 | Motoristas registram no protocolo se escola tinha ou nao ponto fixo (campo no documento de expedicao) |
| Semana 3+ | Maressa consolida ocorrencias e aciona reincidentes via coordenacao de escolas |

### Passos Criticos (S_melhorias)

1. Definir criterio minimo do ponto fixo (identificacao visual, localizacao acessivel)
2. Incluir no POP de malote como obrigacao da escola receptora
3. Comunicar todas as escolas atendidas com prazo de adaptacao (ex: 15 dias)
4. Motorista registra no protocolo se escola nao tinha ponto fixo (dado para cobranca posterior)
5. Maressa revisa ocorrencias mensalmente e aciona coordenacao das escolas reincidentes

---

## Conteudo Minimo do POP (secao escolas)

```
OBRIGACOES DA ESCOLA RECEPTORA DE MALOTE:

1. Designar ponto fixo de malote: local identificado (placa/etiqueta "MALOTE"),
   acessivel sem necessidade de acompanhamento, disponivel no horario de coleta.

2. Concentrar TODOS os itens a despachar no ponto fixo ANTES da chegada do motorista.

3. Responsavel pelo malote na escola deve estar disponivel para assinar protocolo.

REGRA: Item nao disponivel no ponto fixo no momento da coleta sera recolhido
na proxima visita agendada. Nao ha retorno no mesmo dia.
```

---

## Criterios de Validacao Pos-Implementacao

- [ ] Secao de escolas receptoras incluida no POP
- [ ] Comunicado enviado para todas as escolas com data de vigencia
- [ ] Campo "ponto fixo disponivel: sim/nao" adicionado ao protocolo do motorista
- [ ] Primeiro relatorio de ocorrencias gerado apos 30 dias
- [ ] Meta: > 80% das paradas dentro do tempo estimado de roteiro em 60 dias

---

## KPI de Sucesso

- % de paradas dentro do tempo estimado no roteiro > 80% (baseline a medir)

---

## Contexto no Roadmap

**Fase 1 — Quick Win (Semana 1-2)**

```
Semana 1    Semana 2    Semana 3    Semana 4    Mes 2+
[SOL-L01: POP malote + comunicado escolas ──────────]
```

**Dependencias**:
- SOL-L01 e SOL-L04 se complementam: SOL-L01 reduz tempo de parada, SOL-L04 incorpora os tempos reais no roteiro
- Escolas com desvio alto identificadas em SOL-L04 sao priorizadas para SOL-L01
