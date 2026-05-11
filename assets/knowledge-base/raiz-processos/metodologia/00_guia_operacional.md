# Guia Operacional — PRISM-Lite

> Maquina Pragmatica de Melhoria de Processos

---

## 1. Visao Geral

PRISM-Lite e uma metodologia de analise e melhoria de processos organizacionais operada inteiramente via Claude Code. Cada ciclo percorre 7 fases:

| Fase | Nome | Objetivo |
|------|------|----------|
| **P** | Perceber | Inventariar dados disponiveis para o processo |
| **R** | Revelar | Reconstruir fluxo real vs. formal |
| **I** | Investigar | Analise de causa raiz dos problemas |
| **S** | Solucionar | Priorizar e recomendar melhorias |
| **S2** | Pesquisa Profunda | Multi-agentes investigam TODAS as alternativas de solucao na KB (TOTVS/Zeev/HubSpot/n8n) |
| **D** | Detalhar | Plano de implementacao passo-a-passo executavel por qualquer TI |
| **M** | Manter | Comparar antes/depois e alimentar proximo ciclo |

---

## 2. Estrutura de Pastas

```
maquina-melhoria-processos/
├── README.md                      # Guia rapido para novos usuarios
├── metodologia/                   # Fases PRISM-Lite (referencia)
│   ├── 00_guia_operacional.md     # Este arquivo
│   ├── P_perceber.md
│   ├── R_revelar.md
│   ├── R_metricas_cookbook.md  # Complemento da Fase R
│   ├── I_investigar.md
│   ├── S_solucionar.md
│   ├── S2_pesquisa_profunda.md
│   ├── D_detalhar.md
│   └── M_manter.md
├── dados/
│   ├── brutos/                    # INPUT: usuario coloca dados aqui
│   │   ├── _template/             # Copie para criar novo processo
│   │   │   ├── LEIA-ME.md
│   │   │   ├── emails/
│   │   │   ├── zeev/
│   │   │   ├── totvs/
│   │   │   ├── hubspot/
│   │   │   ├── politicas/
│   │   │   ├── diagnosticos/
│   │   │   └── documentos/
│   │   └── [nome-do-processo]/    # Uma pasta por processo
│   └── processados/               # Auto-gerado (.jsonl normalizados)
├── ciclos/                        # OUTPUT: resultados das analises
│   └── YYYY-MM-DD_[processo]/
│       ├── P_inventario.md
│       ├── R_fluxos.md
│       ├── I_causas_raiz.md
│       ├── S_melhorias.md
│       ├── S2_pesquisa_profunda.md
│       ├── D_implementacao.md
│       └── M_comparativo.md
├── knowledge/                     # Base de docs TOTVS/Zeev/HubSpot (auto)
├── scripts/                       # Engine (nao mexa)
└── config/                        # Configuracoes do sistema
    └── knowledge-config.json
```

---

## 3. Setup Inicial

### 3.1 Preparar dados de entrada

A estrutura ja vem pronta. Para cada novo processo:

```bash
cp -r dados/brutos/_template/ dados/brutos/meu-processo/
```

Coloque os exports nas subpastas corretas. Veja `dados/brutos/_template/LEIA-ME.md`.

### 3.2 Dependencias

O Claude Code opera diretamente sobre os dados. Para scripts auxiliares:

```bash
pip install -r requirements.txt
```

### 3.4 Schema dos dados normalizados (.jsonl)

Cada linha de um arquivo `.jsonl` em `dados/processados/` segue este schema:

```json
{
  "id": "string — identificador unico do registro",
  "source": "string — emails|zeev|totvs|hubspot|politicas|diagnosticos",
  "timestamp": "string — ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)",
  "process_hint": "string — identificador do processo (ex: contratacao_fornecedor)",
  "record_type": "string — tipo do registro (ex: workflow_instance, invoice, email_thread, policy, interview)",
  "title": "string — titulo ou assunto",
  "content": "string — corpo/conteudo principal",
  "actors": ["string — lista de pessoas/papeis envolvidos"],
  "metadata": {
    "chaves_livres": "qualquer dado adicional relevante da fonte"
  }
}
```

### 3.5 Fontes de Dados

Todas as fontes sao **opcionais**. O PRISM-Lite trabalha com o que estiver disponivel.

| Fonte | Arquivo | O que contem |
|-------|---------|--------------|
| Emails | `emails.jsonl` | Threads de email relacionadas a processos |
| Zeev (BPM) | `zeev.jsonl` | Instancias de workflow, aprovacoes, SLAs |
| TOTVS (ERP) | `totvs.jsonl` | Transacoes financeiras, pedidos, NFs |
| HubSpot (CRM) | `hubspot.jsonl` | Deals, tickets, interacoes com clientes |
| Politicas | `politicas.jsonl` | Normas, SOPs, manuais internos |
| Diagnosticos | `diagnosticos.jsonl` | Entrevistas transcritas, observacoes de campo |

---

## 4. Como Executar um Ciclo PRISM

### Passo 1: Preparar dados

1. Copiar `dados/brutos/_template/` para `dados/brutos/[nome-do-processo]/`
2. Colocar os exports nas subpastas corretas (emails, zeev, totvs, etc)
3. Nao precisa preencher todas — trabalhe com o que tiver

### Passo 2: Executar analise

No Claude Code, diga:

```
Executar ciclo PRISM-Lite para o processo [nome-do-processo]
```

O sistema ira automaticamente:
- Criar o diretorio do ciclo em `ciclos/YYYY-MM-DD_[processo]/`
- Ingerir e normalizar os dados brutos
- Executar as 7 fases na ordem correta
- Salvar cada output no diretorio do ciclo

### Execucao fase a fase (manual)

Se preferir executar fase por fase:

1. `P_perceber.md` → salva `P_inventario.md`
2. `R_revelar.md` → salva `R_fluxos.md`
3. `I_investigar.md` → salva `I_causas_raiz.md`
4. `S_solucionar.md` → salva `S_melhorias.md`
5. `S2_pesquisa_profunda.md` → salva `S2_pesquisa_profunda.md`
6. `D_detalhar.md` → salva `D_implementacao.md`
7. `M_manter.md` → salva `M_comparativo.md` (somente apos implementacao)

> **Dica**: Cada prompt espera que voce substitua `[PROCESSO]` pelo nome/hint do processo alvo e `[CICLO_DIR]` pelo caminho do diretorio do ciclo.

### Passo 4: Revisar e agir

Revisar os outputs com stakeholders. As melhorias priorizadas na fase S devem ser convertidas em tarefas concretas.

---

## 5. Cadencia Sugerida

| Frequencia | Atividade | Descricao |
|------------|-----------|-----------|
| **Semanal** | Re-ingestao de APIs | Atualizar `.jsonl` com dados recentes de Zeev, TOTVS, HubSpot |
| **Quinzenal** | Ciclo PRISM | Executar fases P-R-I-S para 1-2 processos prioritarios |
| **Mensal** | Review de melhorias | Executar fase M para ciclos anteriores; reuniao com stakeholders |
| **Trimestral** | Portfolio review | Revisar catalogo de processos; re-priorizar; avaliar impacto acumulado |

### Ciclo continuo

```
Semana 1: Ingestao + P + R (processo A)
Semana 2: I + S (processo A) + Ingestao
Semana 3: Ingestao + P + R (processo B) + acompanhar melhorias A
Semana 4: I + S (processo B) + M (ciclo anterior) + Review mensal
```

---

## 6. Troubleshooting

### Dados insuficientes

**Sintoma**: Fase P retorna poucas fontes ou registros.
**Solucao**: Verificar se o `process_hint` esta correto nos `.jsonl`. Considerar ampliar o periodo de coleta. Incluir diagnosticos (entrevistas) para compensar lacunas de dados sistematicos.

### Divergencia entre formal e real muito grande

**Sintoma**: Fase R mostra fluxo real completamente diferente do formal.
**Solucao**: Isso e um achado valido, nao um erro. Documentar e priorizar na fase I. Considerar entrevistar stakeholders para validar o fluxo real identificado.

### Metricas baseline incalculaveis

**Sintoma**: Fase R nao consegue calcular tempos de ciclo.
**Solucao**: Verificar se os timestamps estao preenchidos nos registros. Se nao houver timestamps granulares, usar estimativas baseadas em diagnosticos e documentar como "estimado".

### Arquivos .jsonl muito grandes

**Sintoma**: Claude Code demora ou trunca ao processar.
**Solucao**: Filtrar o `.jsonl` antes de processar:
```bash
jq -c 'select(.process_hint == "contratacao_fornecedor")' dados/processados/zeev.jsonl > /tmp/zeev_filtrado.jsonl
```

### Ciclo PRISM incompleto

**Sintoma**: Fase S foi executada mas melhorias nao foram implementadas.
**Solucao**: Isso e normal. A fase M so deve ser executada apos implementacao. Manter o ciclo aberto em `config/processos.json` ate que haja dados pos-melhoria para comparar.

### Processo sem dono

**Sintoma**: Nenhum ator claro identificado na fase P.
**Solucao**: Isso e um problema organizacional, nao de dados. Registrar como achado na fase I e recomendar designacao de process owner na fase S.

---

## 7. Boas Praticas

1. **Comece pequeno**: Primeiro ciclo com 1 processo simples e 2-3 fontes
2. **Dados > Opiniao**: Sempre buscar evidencia nos dados antes de afirmar algo
3. **Iterativo**: Melhor fazer ciclos curtos frequentes do que analises longas e raras
4. **Transparencia**: Todos os outputs ficam em `ciclos/` — qualquer pessoa pode auditar
5. **Pragmatismo**: Se uma fonte nao esta disponivel, siga em frente com as que tem
6. **Versionamento**: Manter os ciclos nomeados por data para rastreabilidade
