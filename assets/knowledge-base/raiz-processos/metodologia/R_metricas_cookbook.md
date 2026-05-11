# Cookbook de Metricas — Fase R

## Como calcular cada metrica com precisao

### 1. Tempo de Ciclo (Cycle Time)

**Definicao**: Tempo total desde o inicio da primeira etapa ate a conclusao da ultima etapa de uma instancia do processo.

**Calculo**:
```
cycle_time = max(timestamp) - min(timestamp) para registros com mesmo instance_id
```

**Regras**:
- Usar timestamps do Zeev como fonte primaria (mais preciso)
- Se Zeev indisponivel, usar TOTVS (timestamp da transacao)
- Se nenhum disponivel, estimar por datas de emails (menos preciso — registrar como "estimado")
- Excluir finais de semana e feriados? Decidir no inicio e manter consistente
- Reportar: media, mediana, P10, P90 (nao apenas media)

**Exemplo**:
```
Instancia 4521:
  Inicio (Solicitacao): 2026-02-03
  Fim (Recebimento): 2026-02-14
  Cycle time = 11 dias corridos
```

---

### 2. Taxa de Retrabalho (Rework Rate)

**Definicao**: Percentual de instancias que retornam a uma etapa ja concluida.

**Como detectar retrabalho**:
```
Para cada instancia:
  Ordenar eventos por timestamp
  Se etapa[N].step_name == etapa[M].step_name onde M < N:
    → retrabalho detectado
```

**Regras**:
- Contar INSTANCIAS com retrabalho, nao eventos (1 instancia com 3 loops = 1 caso de retrabalho)
- Retrabalho = instancia voltou a etapa anterior, NAO "instancia com status rejeitado"
- Se dados do Zeev indisponiveis, inferir de emails (threads com "correcao", "refazer", "ajustar")
- Reportar: % total e breakdown por etapa (qual etapa mais gera retrabalho)

**Exemplo**:
```
10 instancias no periodo
3 instancias com loop Cotacao → Solicitacao → Cotacao
Rework rate = 3/10 = 30%
Etapa com mais retrabalho: Cotacao (3 de 3 casos)
```

---

### 3. Tempo de Espera (Waiting Time)

**Definicao**: Tempo em que uma instancia esta parada entre etapas (ninguem trabalhando nela).

**Calculo**:
```
Para cada par de etapas consecutivas:
  waiting_time = inicio_etapa[N+1] - fim_etapa[N]
  Se waiting_time < 0: anomalia (registrar)
  Se waiting_time > 0: tempo de espera
```

**Regras**:
- Requer timestamps de inicio E fim de cada etapa (Zeev ideal)
- Se so tem inicio: waiting_time = inicio_etapa[N+1] - inicio_etapa[N] - tempo_medio_etapa[N]
- Excluir finais de semana? Decidir e manter consistente com cycle time
- Reportar: espera total media + espera por etapa (heatmap de gargalos)

---

### 4. Volume

**Definicao**: Numero de instancias iniciadas por periodo.

**Calculo**:
```
Contar instancias unicas (por instance_id) agrupadas por mes
```

**Regras**:
- Usar data de INICIO da instancia, nao de conclusao
- Incluir instancias em andamento (nao so concluidas)
- Reportar: media mensal + tendencia (crescente/estavel/decrescente via regressao simples)

---

### 5. Taxa de Aprovacao/Rejeicao

**Definicao**: % de instancias aprovadas vs rejeitadas na etapa de aprovacao.

**Calculo**:
```
aprovadas = instancias com status "aprovado" ou que passaram para etapa seguinte
rejeitadas = instancias com status "rejeitado" ou que voltaram a etapa anterior
taxa = aprovadas / (aprovadas + rejeitadas)
```

---

### Notas Gerais

- **Segmentacao**: Sempre que possivel, calcular metricas por variante do processo (standard, express, exception)
- **Confianca**: Reportar base de calculo (N instancias). Se N < 20, marcar metrica como "baixa confianca estatistica"
- **Consistencia**: Definir no inicio do ciclo se inclui finais de semana/feriados e manter a mesma regra em todas as metricas
