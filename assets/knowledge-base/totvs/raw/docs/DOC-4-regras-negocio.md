# DOC-4 — Regras de Negócio Educacionais (TOTVS RM Educacional)

> **Escopo**: Regras de domínio educacional que devem ser replicadas e validadas no frontend.
> **Base legal**: LDB (Lei 9.394/96), BNCC, Resoluções CNE/CEB, TDN TOTVS RM Educacional.
> **Versão**: 1.0 | **Data**: 2026-03-20

---

## Sumário

1. [Matrícula](#1-matrícula)
2. [Notas](#2-notas)
3. [Frequência](#3-frequência)
4. [Enturmação](#4-enturmação)
5. [Avaliação](#5-avaliação)
6. [Apuração de Resultado](#6-apuração-de-resultado)
7. [Histórico Escolar](#7-histórico-escolar)
8. [Calendário Acadêmico](#8-calendário-acadêmico)
9. [Documentos Escolares](#9-documentos-escolares)
10. [Permissões por Operação](#10-permissões-por-operação)

---

## 1. Matrícula

### 1.1 Ciclo de Vida (Status)

O status da matrícula segue uma máquina de estados com transições controladas. O frontend deve impedir transições inválidas e solicitar confirmação nas transições irreversíveis.

```
                    ┌─────────────────────────────────────┐
                    │                                     │
         [Nova]     ▼         [Suspensão temporária]      │
           ──► ATIVA ──────────────► TRANCADA             │
                │   ◄──────────────────┘                  │
                │                                         │
                ├──────────────────► CANCELADA            │
                │                   (irreversível)        │
                │                                         │
                ├──────────────────► TRANSFERIDA          │
                │                   (irreversível)        │
                │                                         │
                ├──────────────────► CONCLUÍDA            │
                │                   (irreversível)        │
                │                                         │
                └──────────────────► EVADIDA              │
                                    (irreversível)        │
                                          │               │
                                          └───────────────┘
                                    (re-matrícula possível
                                     gera novo registro)
```

### 1.2 Transições Válidas

| Status Atual | Pode Transicionar Para | Quem Autoriza | Observações |
|---|---|---|---|
| ATIVA | TRANCADA | Secretária + Diretor | Requer justificativa e prazo |
| ATIVA | CANCELADA | Diretor | Irreversível; gera rescisão contratual |
| ATIVA | TRANSFERIDA | Secretária + Diretor | Requer declaração de transferência |
| ATIVA | CONCLUÍDA | Sistema (automático) | Após apuração de resultado final |
| ATIVA | EVADIDA | Secretária | Após N dias sem frequência (configurable) |
| TRANCADA | ATIVA | Secretária + Diretor | Dentro do prazo de trancamento |
| TRANCADA | CANCELADA | Diretor | Irreversível |
| TRANCADA | EVADIDA | Sistema | Após período máximo de trancamento |
| CANCELADA | — | — | Não permite transição; nova matrícula gera novo registro |
| TRANSFERIDA | — | — | Não permite transição |
| CONCLUÍDA | — | — | Não permite transição |
| EVADIDA | — | — | Nova matrícula possível via re-matrícula |

**Transições proibidas** (frontend deve bloquear e exibir erro):
- CONCLUÍDA → qualquer outro status
- CANCELADA → qualquer outro status
- TRANSFERIDA → qualquer outro status
- ATIVA → ATIVA (operação no-op)
- Qualquer status → ATIVA sem passar por TRANCADA (exceto nova matrícula)

### 1.3 Pré-requisitos para Matrícula

A matrícula só pode ser confirmada com a checklist documental completa. O frontend deve validar e registrar cada item.

| Documento | Obrigatório | Observações |
|---|---|---|
| Certidão de Nascimento | Sim | Original + cópia; para alunos menores |
| RG ou CPF do responsável | Sim | Documento com foto; para maiores de 18: do próprio aluno |
| CPF do aluno | Sim (a partir do EF) | Obrigatório para geração de histórico MEC |
| Comprovante de Residência | Sim | Máximo 3 meses de emissão |
| Histórico Escolar Anterior | Sim (exceto Educação Infantil) | Exceto matrícula inicial |
| Fotos 3x4 | Sim | Quantidade conforme escola (tipicamente 2) |
| Atestado de Saúde / Cartão de Vacina | Configurable | Obrigatório em algumas redes |
| Laudo médico ou PEI | Condicional | Para alunos com necessidades especiais |

**Regra**: enquanto documentos obrigatórios estiverem pendentes, a matrícula pode ser salva com status `PENDENTE_DOCUMENTACAO` (status transitório interno), mas não pode ser ativada.

### 1.4 Re-matrícula

- Deve ocorrer dentro da **janela de re-matrícula** — período configurável por escola no calendário acadêmico.
- Requer que a matrícula atual esteja com status **ATIVA** ou **CONCLUÍDA** (para progressão de série).
- Gera um **novo registro de matrícula** (novo `CODCOLIGADA` + `CODFILIAL` + `RA` + ano letivo).
- Gera automaticamente um **novo contrato financeiro** com as parcelas do ano vigente.
- Alunos com matrícula EVADIDA podem re-matricular, mas devem passar pela triagem documental completa.

### 1.5 Regras de Unicidade e Multi-filial

| Regra | Descrição |
|---|---|
| Uma matrícula ativa por coligada | O aluno não pode ter duas matrículas ativas na mesma `CODCOLIGADA` no mesmo ano letivo |
| Multi-filial permitida | O mesmo aluno pode ter matrículas em filiais distintas (escolas de turnos diferentes), desde que em `CODFILIAL` diferentes |
| Validação de RA | O Registro do Aluno (RA) é único por coligada; a chave é `(CODCOLIGADA, CODFILIAL, RA)` |

### 1.6 Dependência Financeira

- A confirmação da matrícula dispara a criação do **contrato financeiro** via API (`POST /api/financeiro/contratos`).
- O cancelamento da matrícula gera **rescisão do contrato** (com cálculo de multa conforme regras contratuais).
- O trancamento pode gerar **pausa nas parcelas** (depende da configuração da escola).
- O frontend deve exibir aviso antes de transições que impactem financeiro.

---

## 2. Notas

### 2.1 Tipos de Fórmula de Média

| Tipo | Descrição | Fórmula |
|---|---|---|
| MÉDIA ARITMÉTICA | Média simples entre etapas | `(N1 + N2 + N3 + N4) / 4` |
| MÉDIA PONDERADA | Média com pesos por etapa | `(B1×P1 + B2×P2 + B3×P3 + B4×P4) / (P1+P2+P3+P4)` |
| SOMA | Soma direta das notas | `N1 + N2 + N3 + N4` |
| MAIOR NOTA | Considera apenas a maior nota | `MAX(N1, N2, N3, N4)` |

Onde: `Bn` = nota do bimestre n, `Pn` = peso do bimestre n (configurável por escola/série/disciplina).

**Exemplo de Média Ponderada (4 bimestres com pesos diferentes)**:
```
Pesos: P1=1, P2=1, P3=2, P4=2
Notas: B1=6.0, B2=7.0, B3=8.0, B4=9.0

Média = (6.0×1 + 7.0×1 + 8.0×2 + 9.0×2) / (1+1+2+2)
      = (6.0 + 7.0 + 16.0 + 18.0) / 6
      = 47.0 / 6
      = 7.83 → arredondado para 7.8
```

### 2.2 Regras de Arredondamento

| Regra | Valor | Resultado | Observação |
|---|---|---|---|
| Truncar 1 decimal | 7.83 | 7.8 | Padrão TOTVS RM |
| Arredondamento .05 | 7.85 → 7.9 | 7.9 | Round half up |
| Arredondamento .04 | 7.84 → 7.8 | 7.8 | Trunca |
| Configurável por escola | — | — | Escola pode escolher truncar ou arredondar |

**Implementação no frontend**: sempre exibir 1 casa decimal. Calcular com precisão interna (4+ casas) e arredondar apenas na exibição e no envio para a API.

### 2.3 Escala de Notas

| Escala | Valores | Uso | Mínimo Aprovação |
|---|---|---|---|
| 0.0 – 10.0 | Decimal, 1 casa | Padrão nacional (maioria) | 6.0 ou 7.0 (configurable) |
| 0 – 100 | Inteiro | Algumas redes privadas | 60 ou 70 (configurable) |
| A – F | Letra | Internacional/bilíngue | C ou equivalente |
| Descritivo | Texto | Educação Infantil | Não se aplica |

**Mapeamento A-F para numérico** (para relatórios comparativos):
```
A = 9.0 – 10.0
B = 7.0 – 8.9
C = 5.0 – 6.9
D = 3.0 – 4.9
F = 0.0 – 2.9
```

### 2.4 Recuperação (Tipos)

#### Recuperação Paralela (durante o bimestre)
- Ocorre **dentro do bimestre**, antes do fechamento da etapa.
- A nota de recuperação **substitui a menor sub-nota** do aluno na avaliação correspondente.
- Não altera a nota final do bimestre diretamente — altera o componente menor.
- Registro: tipo de avaliação `RECUPERACAO` vinculado à etapa corrente.

#### Recuperação Final (ao fim do ano letivo)
- Ocorre após o fechamento de todas as etapas.
- O aluno tem direito quando: nota final < mínimo E nota >= nota de recuperação mínima (configurable).
- Cálculo da nota final com recuperação:
  - **Modelo MAX**: `nota_final = MAX(media_anual, nota_recuperacao)` — mais comum
  - **Modelo MÉDIA**: `nota_final = (media_anual + nota_recuperacao) / 2`
  - Configurable por escola/disciplina.

#### Exame Final
- Última instância, após recuperação final.
- Disponível para alunos que não atingiram a média após recuperação.
- Nota mínima no exame para aprovação: geralmente 5.0 (configurable).
- Resultado final: `(media_anual + nota_exame) / 2 >= minimo_aprovacao`.

**Fluxo de decisão**:
```
Nota Anual >= Mínimo?
    SIM → APROVADO
    NÃO →
        Escola oferece Recuperação Final?
            SIM → Realiza recuperação
                  MAX(anual, recuperação) >= mínimo?
                      SIM → APROVADO
                      NÃO →
                          Exame Final disponível?
                              SIM → Realiza exame
                                    (anual + exame) / 2 >= mínimo?
                                        SIM → APROVADO
                                        NÃO → REPROVADO POR NOTA
                              NÃO → REPROVADO POR NOTA
            NÃO → REPROVADO POR NOTA
```

### 2.5 Composição de Notas por Etapa

Cada etapa pode ter múltiplas avaliações com pesos individuais:

```
Etapa: 1º Bimestre
  ├── Prova 1         peso: 4.0  nota: 7.5
  ├── Trabalho        peso: 2.0  nota: 9.0
  ├── Participação    peso: 1.0  nota: 8.0
  └── Prova 2         peso: 3.0  nota: 6.5

Nota do Bimestre = (7.5×4 + 9.0×2 + 8.0×1 + 6.5×3) / (4+2+1+3)
                 = (30.0 + 18.0 + 8.0 + 19.5) / 10
                 = 75.5 / 10
                 = 7.55 → exibido como 7.6 (ou 7.5 se truncar)
```

### 2.6 Validações de Nota (Frontend)

| Validação | Regra | Mensagem de Erro |
|---|---|---|
| Nota não pode ser negativa | `nota >= 0` | "Nota não pode ser inferior a zero" |
| Nota não excede máximo da avaliação | `nota <= nota_maxima_avaliacao` | "Nota excede o valor máximo permitido para esta avaliação" |
| Nota compatível com escala da disciplina | Verificar escala configurada | "Nota fora da escala configurada para esta disciplina" |
| Etapa ainda aberta | `data_atual <= data_fechamento_etapa` | "A etapa já foi encerrada. Contate a coordenação para alterações" |
| Professor autorizado | Professor leciona a turma/disciplina | "Você não tem permissão para lançar notas nesta turma" |

---

## 3. Frequência

### 3.1 Tipos de Registro

| Código | Descrição | Computa como Falta | Pode ser Revertido |
|---|---|---|---|
| P | Presente | Não | Não |
| F | Falta | Sim | Sim (→ FJ ou FA) |
| FJ | Falta Justificada | Sim (computa na contagem, mas não perde direito) | Não (registrado) |
| FA | Falta Abonada | Não | Não |

> **Atenção**: FJ e FA têm tratamentos distintos. FJ ainda conta como falta para efeito de cálculo de frequência em algumas escolas. FA não conta. Verificar configuração da escola.

### 3.2 Frequência Mínima (LDB Art. 24, Inc. VI)

- **Frequência mínima obrigatória**: **75%** das aulas dadas.
- Cálculo padrão:

```
Frequência (%) = ((total_aulas - faltas_não_abonadas) / total_aulas) × 100

Onde faltas_não_abonadas = F + FJ (conforme configuração)
```

- Configuração de escopo:
  - **Por disciplina**: cada disciplina tem sua contagem independente (mais rigoroso).
  - **Global**: frequência calculada sobre o total de aulas de todas as disciplinas.
  - A escola configura o escopo; o frontend deve exibir de acordo.

### 3.3 Tipos de Justificativa

| Tipo | Código | Documentação Exigida | Converte para |
|---|---|---|---|
| Atestado Médico | ATM | CRM + período de afastamento | FA (abonada) |
| Óbito Familiar | OBF | Certidão de óbito | FA (abonada) |
| Convocação Judicial | COJ | Documento oficial do tribunal | FA (abonada) |
| Atividade Escolar Oficial | AEO | Declaração da escola/evento | FA (abonada) |
| Representação Esportiva | RES | Convocação oficial federação | FA (abonada) |
| Outros (justificativa texto) | OUT | A critério da coordenação | FJ (justificada, mas computa) |

### 3.4 Processo de Abono

1. Responsável/aluno entrega documentação à secretaria.
2. Secretária registra justificativa no sistema (associada às datas de falta).
3. Coordenador/Diretor aprova ou rejeita o abono.
4. Sistema converte `F` → `FA` automaticamente nas datas aprovadas.
5. Frequência é recalculada.

**Regra de prazo**: o abono deve ser solicitado em até N dias úteis após o retorno do aluno (configurable por escola, tipicamente 5 dias úteis).

### 3.5 Regras Especiais

| Situação | Regra |
|---|---|
| Educação Infantil (até 5 anos) | Frequência é registrada, mas reprovação por falta não se aplica. Avaliação é descritiva. |
| Regime de progressão continuada | Algumas redes estaduais não reprovam por falta no ciclo (verificar normativa estadual) |
| Ensino a Distância (EAD) | Frequência pode ser computada por participação em atividades online |
| Licença médica prolongada | Aluno em tratamento pode ter regime especial de estudos (decreto estadual) |

### 3.6 Impacto na Apuração de Resultado

- Aluno com frequência < 75% em qualquer disciplina (no escopo configurado) é **automaticamente REPROVADO POR FALTA**, **independentemente das notas**.
- O sistema deve calcular e exibir a situação em tempo real conforme o professor lança chamadas.
- O frontend deve alertar quando o aluno atingir 20%, 10% e 0% de faltas restantes (thresholds configuráveis).

---

## 4. Enturmação

### 4.1 Regras de Elegibilidade

Para enturmar um aluno em uma turma, todas as condições devem ser satisfeitas:

| Condição | Validação | Erro |
|---|---|---|
| Matrícula ativa | `status_matricula == 'ATIVA'` | "Aluno não possui matrícula ativa" |
| Turma existe no período letivo | Turma pertence ao ano/série correto | "Turma não encontrada para o período letivo" |
| Capacidade disponível | `alunos_enturmados < capacidade_maxima` | "Turma lotada. Capacidade máxima atingida" |
| Mesma série | Série da matrícula == série da turma | "Série do aluno não corresponde à série da turma" |
| Não duplicado na disciplina | Aluno não está em outra turma da mesma disciplina | "Aluno já está enturmado em turma desta disciplina" |

### 4.2 Capacidade de Turma

| Nível | Capacidade Típica | Mínimo Legal (por rede) | Máximo (por rede) |
|---|---|---|---|
| Educação Infantil (0-3 anos) | 8–12 | — | 15 |
| Educação Infantil (4-5 anos) | 15–20 | — | 25 |
| Ensino Fundamental (Anos Iniciais) | 25–30 | 20 | 35 |
| Ensino Fundamental (Anos Finais) | 30–35 | 25 | 40 |
| Ensino Médio | 35–40 | 30 | 45 |

> Capacidade máxima é configurável por escola/turma. O frontend deve buscar `capacidade_maxima` da turma via API e validar em tempo real.

### 4.3 Transferência Entre Turmas

- Permitida dentro do **mesmo período letivo**.
- Gera **auditoria** (quem transferiu, de onde, para onde, data, motivo).
- Se o aluno já possui notas lançadas na turma de origem, as notas são mantidas e associadas à disciplina (não à turma).
- A transferência não pode gerar duplicidade de disciplina (regra 4.1 mantida).

### 4.4 Enturmação em Lote (Bulk)

A secretaria pode enturmar por série (auto-assign):

1. Secretaria seleciona a série e o período letivo.
2. Sistema lista todos os alunos com matrícula ativa na série sem enturmação.
3. Sistema distribui alunos entre turmas disponíveis (ordem: turma A até lotada → turma B → ...).
4. Regras de prioridade aplicadas antes da distribuição:
   - Irmãos: mantidos na mesma turma quando possível.
   - Alunos retidos: priorizados para turmas com professor experiente (configurable).
   - Proximidade de endereço: quando escola oferece turnos diferentes.
5. Secretaria revisa e confirma a distribuição.
6. Sistema executa a enturmação em lote.

### 4.5 Restrições de Enturmação para Turmas Lotadas

Quando a turma está na capacidade máxima, somente o Diretor pode autorizar inclusão de aluno excedente. O sistema deve:
1. Bloquear a ação para secretária/coordenador.
2. Exibir modal de solicitação para o diretor aprovar.
3. Registrar a exceção no log de auditoria.

---

## 5. Avaliação

### 5.1 Tipos de Avaliação

| Tipo | Código | Descrição | Permite Recuperação |
|---|---|---|---|
| Prova | PROVA | Avaliação escrita formal | Sim |
| Trabalho | TRAB | Trabalho individual ou em grupo | Não (tipicamente) |
| Seminário | SEM | Apresentação oral | Não |
| Participação | PART | Nota de participação contínua | Não |
| Atividade | ATIV | Atividade em sala ou para casa | Não |
| Simulado | SIM | Prova modelo ENEM/vestibular | Não |
| Recuperação | REC | Avaliação de recuperação | — |

### 5.2 Atributos de uma Avaliação

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| Tipo | Enum | Sim | Ver tabela 5.1 |
| Peso | Decimal (0.0–10.0) | Sim | Soma dos pesos da etapa deve ser configurada |
| Nota máxima | Decimal | Sim | Deve ser compatível com a escala da disciplina |
| Data de aplicação | Date | Sim | Deve estar dentro do período da etapa |
| Disciplina | FK | Sim | Professor deve lecionar a disciplina |
| Turma | FK | Sim | Professor deve ser titular da turma/disciplina |
| Etapa | FK | Sim | Etapa deve estar aberta |
| Descrição | Texto | Não | Conteúdos avaliados |
| Data limite lançamento | Date | Calculado | data_fechamento_etapa (sem override) |

### 5.3 Tipos de Etapa

| Tipo | Quantidade/Ano | Uso Típico | Exemplo de Período |
|---|---|---|---|
| BIMESTRE | 4 | Maioria das escolas privadas | Fev–Abr / Mai–Jul / Ago–Out / Nov–Dez |
| TRIMESTRE | 3 | Algumas redes estaduais | Fev–Abr / Mai–Ago / Set–Dez |
| SEMESTRE | 2 | EJA, cursos técnicos | Fev–Jun / Jul–Dez |

- O tipo de etapa é configurado por escola e pode variar por curso/série.
- O frontend deve carregar a configuração de etapa por `(CODCOLIGADA, CODFILIAL, CODCURSO, CODGRADECURRICULAR)`.

### 5.4 Regras de Criação de Avaliação

| Regra | Descrição |
|---|---|
| Professor autorizado | Professor só cria avaliações para turmas/disciplinas que ele leciona |
| Etapa aberta | A etapa deve estar com status ABERTA (não fechada pela coordenação) |
| Limite por etapa | Escola pode configurar número máximo de avaliações por tipo por etapa |
| Antecedência mínima | Prova deve ser cadastrada com antecedência mínima (configurable, tipicamente 3 dias úteis) |
| Conflito de datas | Sistema verifica conflito de provas na mesma turma no mesmo dia |

### 5.5 Calendário de Avaliações

- Definido pela coordenação pedagógica.
- Visível para professores (para lançamento), alunos e responsáveis (para consulta).
- O professor pode sugerir datas; a coordenação aprova ou redireciona.
- Integrado ao Calendário Acadêmico — avaliações não podem ser cadastradas em feriados ou dias não letivos.

---

## 6. Apuração de Resultado

### 6.1 Situações de Resultado Final

| Situação | Código | Condições | Prioridade |
|---|---|---|---|
| Aprovado | APR | Nota >= mínimo E Frequência >= 75% | — |
| Em Recuperação | REC | Nota < mínimo E Frequência >= 75% E escola oferece recuperação | — |
| Reprovado por Nota | RPN | Nota < mínimo E Frequência >= 75% E sem recuperação disponível | — |
| Reprovado por Falta | RPF | Frequência < 75% (independente da nota) | Prioridade sobre RPN |
| Progressão Parcial | PP | Aprovado com até N disciplinas pendentes | Escola configura N (tipicamente 2–3) |
| Em Conselho | CON | Caso limítrofe encaminhado ao conselho de classe | — |

> **Regra de prioridade**: RPF prevalece sobre RPN. Se o aluno tem frequência < 75% E nota < mínimo, o resultado é **RPF** (não RPN).

### 6.2 Fluxo de Apuração

```
1. FECHAMENTO DE ETAPA
   └── Coordenação fecha a etapa (data_fechamento_etapa)
       └── Sistema calcula nota parcial da etapa

2. FECHAMENTO DO ANO LETIVO
   └── Sistema calcula:
       ├── Média anual por disciplina (fórmula configurada)
       └── Frequência final por disciplina (ou global)

3. PROCESSAMENTO DE RECUPERAÇÃO (se aplicável)
   └── Alunos com nota < mínimo são elegíveis
       └── Sistema aguarda lançamento da nota de recuperação
           └── Sistema recalcula nota final pós-recuperação

4. APURAÇÃO PRÉVIA (RASCUNHO)
   └── Sistema gera situação calculada para revisão
       └── Coordenação revisa e identifica casos para conselho

5. CONSELHO DE CLASSE
   └── Casos limiares são discutidos
       └── Conselho pode MANTER ou OVERRIDE o resultado calculado
           └── Override registrado com justificativa e assinatura

6. HOMOLOGAÇÃO
   └── Diretor homologa o resultado final
       └── Status: HOMOLOGADO (imutável)
           └── Geração da Ata de Resultado Final
```

### 6.3 Progressão Parcial

- O aluno é aprovado de série, mas **com pendência** em até N disciplinas reprovadas (N configurável).
- As disciplinas em progressão parcial devem ser cursadas no ano seguinte em regime de dependência.
- Se o aluno reprovar em mais de N disciplinas, o resultado é **REPROVADO** (sem progressão).

### 6.4 Override por Conselho

- O conselho de classe pode alterar o resultado calculado pelo sistema.
- O override deve ser registrado com:
  - Justificativa textual obrigatória
  - Ata assinada pelos membros do conselho
  - Aprovação do diretor
- O frontend deve exibir claramente quando um resultado é "Calculado pelo sistema" versus "Deliberado pelo conselho".

### 6.5 Regras Especiais por Nível

| Nível | Regra de Resultado |
|---|---|
| Educação Infantil | Sem reprovação. Progressão automática. Avaliação descritiva (relatório de desenvolvimento). |
| EF Anos Iniciais (1º ao 5º) | Progressão por ciclos em algumas redes. Verificar normativa estadual/municipal. |
| EF Anos Finais (6º ao 9º) | Reprovação por nota ou falta. Progressão parcial disponível. |
| Ensino Médio | Reprovação por nota ou falta. Progressão parcial disponível. Exame final disponível. |
| EJA | Progressão por módulo/componente. Regras específicas por normativa do estado. |

---

## 7. Histórico Escolar

### 7.1 Campos Obrigatórios

| Campo | Fonte | Observações |
|---|---|---|
| Nome completo do aluno | Cadastro de Pessoas | Deve coincidir com certidão de nascimento |
| Data de nascimento | Cadastro de Pessoas | — |
| Nome do responsável | Cadastro de Pessoas | Para menores de 18 anos |
| Escola emissora | Cadastro da Filial | Nome, CNPJ, endereço |
| Cidade/UF | Cadastro da Filial | — |
| Ano letivo | Período Letivo | — |
| Série/Ano | Matrícula | — |
| Disciplinas cursadas | Grade Curricular | Com carga horária |
| Nota final por disciplina | Apuração de Resultado | Após homologação |
| Frequência por disciplina | Registro de Frequência | Em % |
| Total de aulas dadas | Calendário Acadêmico | — |
| Resultado (APR/RPF/RPN) | Apuração de Resultado | — |
| Total de horas letivas | Calendário Acadêmico | Mínimo 800h/ano |
| Assinatura do Diretor | Digital/Física | Nome + cargo + CPF |
| Assinatura do Secretário | Digital/Física | Nome + cargo + CPF |
| Data de emissão | Sistema | — |
| Número do histórico | Sistema (sequencial) | Para controle de versões |

### 7.2 Regras de Emissão

| Regra | Descrição |
|---|---|
| Somente após homologação | O histórico só pode ser gerado após a apuração ser homologada pelo diretor |
| Imutabilidade | Um histórico emitido não pode ser alterado. Correções geram um novo documento com referência ao anterior |
| Versionamento | Cada emissão recebe número sequencial: `HIST-{ANO}-{RA}-{VERSAO}` |
| Formato MEC | Deve seguir as diretrizes do MEC/CNE para reconhecimento nacional |
| Autenticidade | Documento deve ter código de verificação online (QR Code ou chave) |

### 7.3 Processo de Geração

```
1. Secretária solicita geração (POST /api/documentos/historico/{matriculaId})
2. Sistema valida: apuração homologada?
   ├── NÃO → Erro: "Apuração não homologada. Contate a direção."
   └── SIM → Sistema compõe o histórico com todos os campos obrigatórios
              └── PDF gerado via motor de relatórios TOTVS RM
                  └── Stored no sistema com registro de data/hora/usuário
                      └── Disponível para download/impressão
```

---

## 8. Calendário Acadêmico

### 8.1 Requisitos Legais (LDB Art. 24, Inc. I)

| Requisito | Valor Mínimo | Observações |
|---|---|---|
| Dias letivos por ano | 200 dias | Feriados e recessos não contam |
| Horas de efetivo trabalho escolar | 800 horas | Para EF e EM; EI tem regras próprias |
| Horas para EI (4-5 anos) | 800 horas | Resolução CNE/CEB 05/2009 |
| Reposição de dias | Obrigatória | Dias perdidos devem ser compensados |

### 8.2 Tipos de Dia no Calendário

| Tipo | Código | Conta como Dia Letivo | Observações |
|---|---|---|---|
| Dia Letivo | DL | Sim | Aulas normais |
| Feriado Nacional/Estadual/Municipal | FER | Não | Não pode ser alterado pela escola |
| Recesso Escolar | REC | Não | Definido pela escola/rede |
| Planejamento Pedagógico | PLAN | Não (tipicamente) | Sem alunos; professores presentes |
| Conselho de Classe | CC | Não | Reunião de professores e coordenação |
| Evento Escolar | EVT | Pode ser (configurable) | Festa junina, gincana, etc. |
| Reposição | REP | Sim | Dia de recuperação de dias perdidos |

### 8.3 Estrutura de Períodos

```
Ano Letivo (ex: 2026)
├── 1º Bimestre (Fev–Abr)
│   ├── Semana 1 (02/02 – 06/02)
│   │   ├── 02/02 (Seg) — DL
│   │   ├── 03/02 (Ter) — DL
│   │   ├── 04/02 (Qua) — DL
│   │   ├── 05/02 (Qui) — DL
│   │   └── 06/02 (Sex) — DL
│   └── ...
├── 2º Bimestre (Mai–Jul)
├── 3º Bimestre (Ago–Out)
└── 4º Bimestre (Nov–Dez)
```

### 8.4 Regras de Reposição

- Dias perdidos por eventos imprevistos (greve, calamidade, epidemia) devem ser repostos.
- A escola define as datas de reposição e atualiza o calendário.
- O sistema recalcula automaticamente o total de dias letivos e horas ao incluir reposições.
- O frontend deve exibir um indicador visual de dias letivos acumulados vs. meta (200 dias).
- **Alerta**: sistema deve notificar quando o total projetado for inferior a 200 dias antes do fim do ano.

### 8.5 Integração com Avaliações e Frequência

- O lançamento de frequência só é possível em dias marcados como `DL` ou `REP` no calendário.
- Avaliações não podem ser agendadas em `FER`, `REC`, `PLAN` ou `CC`.
- O calendário é a fonte de verdade para cálculo de total de aulas dadas por disciplina.

---

## 9. Documentos Escolares

### 9.1 Tipos de Documentos e Casos de Uso

| Documento | Código | Gerado Por | Quando Emitir | Requer Homologação |
|---|---|---|---|---|
| Boletim Escolar | BOL | Secretária | Ao fim de cada etapa ou sob demanda | Não (parcial) / Sim (final) |
| Histórico Escolar | HIST | Secretária | Ao fim do ano letivo ou transferência | Sim |
| Declaração de Matrícula | DM | Secretária | Sob demanda do responsável | Não |
| Declaração de Transferência | DT | Secretária | Quando matrícula é transferida | Sim (diretor) |
| Ata de Resultado Final | ATA | Sistema | Ao fim do processo de apuração | Sim (diretor) |
| Ficha Individual do Aluno | FI | Secretária | Sob demanda / auditoria | Não |
| Livro de Matrícula | LM | Sistema | Gerado periodicamente | Sim (diretor) |
| Diploma | DIP | Secretária + Diretor | Ao concluir o curso | Sim (MEC para alguns níveis) |

### 9.2 Geração via TOTVS RM

Todos os documentos são gerados via motor de relatórios do TOTVS RM:

```http
POST /RM/api/Educacional/v1/ViewEducationalReports
Content-Type: application/json

{
  "reportId": "HIST_ESCOLAR_ALUNO",
  "parameters": {
    "CODCOLIGADA": 1,
    "CODFILIAL": 1,
    "RA": "2024001234",
    "ANOLETIVO": 2026
  },
  "outputFormat": "PDF"
}
```

- A resposta retorna um blob PDF ou uma URL assinada para download.
- O frontend deve armazenar o registro de geração (quem gerou, quando, qual versão).

### 9.3 Documentos Exigidos por Evento

| Evento | Documentos Exigidos |
|---|---|
| Nova Matrícula | Histórico Escolar Anterior (exceto EI inicial), certidão nascimento, RG/CPF responsável, comprovante residência |
| Transferência (saída) | Declaração de Transferência, Histórico Escolar Parcial ou Completo (conforme época do ano) |
| Conclusão de Curso | Histórico Escolar Final, Diploma (EM e cursos técnicos) |
| Re-matrícula | Comprovante de residência atualizado; demais documentos já arquivados |

---

## 10. Permissões por Operação

### 10.1 Matriz de Permissões

| Operação | Professor | Secretária | Coordenador | Diretor | Sistema |
|---|---|---|---|---|---|
| **Matrícula** | | | | | |
| Criar matrícula | — | Escreve | Lê | Aprova | — |
| Alterar status matrícula | — | Solicita | Solicita | Aprova | Auto (conclusão) |
| Cancelar matrícula | — | — | Solicita | Executa | — |
| **Notas** | | | | | |
| Lançar notas (próprias turmas) | Escreve | — | — | — | — |
| Lançar notas (qualquer turma) | — | — | Override c/ justificativa | Override c/ justificativa | — |
| Visualizar notas | Próprias turmas | Lê todas | Lê todas | Lê todas | — |
| Fechar etapa | — | — | Executa | Confirma | — |
| **Frequência** | | | | | |
| Lançar chamada (próprias turmas) | Escreve | — | — | — | — |
| Abonar faltas | — | Solicita | Aprova | Aprova | — |
| Visualizar frequência | Próprias turmas | Lê todas | Lê todas | Lê todas | — |
| **Avaliação** | | | | | |
| Criar avaliação (próprias turmas) | Escreve | — | — | — | — |
| Aprovar calendário de avaliações | — | — | Aprova | Confirma | — |
| **Ocorrências** | | | | | |
| Registrar ocorrência | Cria | Cria | Cria | Cria | — |
| Aprovar/encaminhar ocorrência | — | — | Executa | Executa | — |
| **Documentos** | | | | | |
| Gerar documentos | — | Executa | Lê | Assina | — |
| Assinar documentos digitais | — | Assina (secretário) | — | Assina (diretor) | — |
| **Enturmação** | | | | | |
| Enturmar aluno | — | Executa | Executa | Aprova (excedente) | Bulk auto |
| Transferir entre turmas | — | Executa | Aprova | — | — |
| **Apuração de Resultado** | | | | | |
| Visualizar apuração | Próprias turmas | Lê | Lê + Override (conselho) | Lê + Homologa | Calcula |
| Override de resultado | — | — | Conselho (com ata) | Confirma | — |
| Homologar resultado | — | — | — | Executa | — |

### 10.2 Regras de Controle de Acesso no Frontend

1. **Campos de leitura**: exibidos para todos os papéis com permissão de leitura; ocultos (não só desabilitados) para papéis sem acesso.
2. **Campos de escrita**: input/botão habilitado somente para o papel com permissão de escrita.
3. **Ações destrutivas** (cancelar matrícula, fechar etapa, homologar): sempre exigem confirmação modal com texto de impacto claro.
4. **Override de nota**: deve exibir campo de justificativa obrigatório e registrar no audit trail.
5. **Auditoria**: toda ação de escrita, atualização ou exclusão deve ser registrada com `(userId, role, timestamp, entidade, operação, valorAnterior, valorNovo)`.

### 10.3 Perfis de Acesso no TOTVS RM

| Perfil TOTVS | Mapeamento Frontend | Nível de Acesso |
|---|---|---|
| `EDU_PROFESSOR` | Professor | Restrito às suas turmas/disciplinas |
| `EDU_SECRETARIA` | Secretária | Operacional — todas as turmas, sem homologação |
| `EDU_COORDENADOR` | Coordenador | Pedagógico — read-all + override com justificativa |
| `EDU_DIRETOR` | Diretor | Executivo — homologação, aprovações finais |
| `EDU_ADMIN` | Administrador | Full access — configurações, permissões |
| `EDU_RESPONSAVEL` | Responsável/Aluno | Read-only — dados do aluno vinculado |

---

## Apêndice A — Configurações por Escola (Parâmetros)

Os seguintes parâmetros são configuráveis por escola (`CODCOLIGADA` + `CODFILIAL`) e devem ser carregados via API no início da sessão:

| Parâmetro | Tipo | Valor Padrão | Impacto |
|---|---|---|---|
| `nota_minima_aprovacao` | Decimal | 6.0 | Cálculo de resultado |
| `formula_media` | Enum | `MEDIA_ARITMETICA` | Cálculo de médias |
| `arredondamento` | Enum | `TRUNCAR` | Exibição e cálculo de notas |
| `escala_nota` | Enum | `0_10` | Validação de lançamento |
| `frequencia_minima` | Decimal | 75.0 | Cálculo de resultado por falta |
| `escopo_frequencia` | Enum | `POR_DISCIPLINA` | Cálculo de frequência |
| `tipo_etapa` | Enum | `BIMESTRE` | Estrutura do calendário |
| `recuperacao_paralela` | Boolean | `true` | Habilita rec. durante bimestre |
| `recuperacao_final` | Boolean | `true` | Habilita rec. ao fim do ano |
| `formula_recuperacao_final` | Enum | `MAX` | MAX ou MEDIA |
| `exame_final` | Boolean | `false` | Habilita exame final |
| `progressao_parcial` | Boolean | `false` | Habilita progressão parcial |
| `max_disciplinas_pp` | Integer | 2 | Máximo de disciplinas em PP |
| `janela_rematricula_inicio` | Date | — | Início do período de re-matrícula |
| `janela_rematricula_fim` | Date | — | Fim do período de re-matrícula |
| `capacidade_padrao_turma` | Integer | 35 | Usado como default na criação de turmas |
| `prazo_abono_dias_uteis` | Integer | 5 | Prazo para solicitar abono de falta |

---

## Apêndice B — Referências Normativas

| Documento | Artigo/Inciso | Tema |
|---|---|---|
| LDB (Lei 9.394/96) | Art. 24, Inc. I | Mínimo 200 dias e 800 horas letivas |
| LDB (Lei 9.394/96) | Art. 24, Inc. VI | Frequência mínima de 75% |
| LDB (Lei 9.394/96) | Art. 32 | Ensino Fundamental — duração e organização |
| Resolução CNE/CEB 07/2010 | — | Diretrizes curriculares EF |
| Resolução CNE/CEB 02/2012 | — | Diretrizes EJA |
| Resolução CNE/CEB 05/2009 | — | Diretrizes Educação Infantil |
| Resolução CNE/CEB 03/2018 | — | BNCC — Ensino Médio |
| TDN TOTVS RM Educacional | — | Documentação técnica dos módulos |
| MEC — Manual de Orientação | — | Histórico Escolar e documentação |

---

---

## Regras de Negócio — Módulo Financeiro

### RN-FIN-001: Cálculo de Inadimplência
- Parcela **vencida**: `DTVENCIMENTO < data_atual` e `STATUSLAN = 0`
- Aluno **inadimplente**: possui ao menos 1 parcela vencida
- Percentual = (alunos inadimplentes / total de alunos) × 100

### RN-FIN-002: Aging de Inadimplência
- Faixas: até 30d, 31-60d, 61-90d, 91-180d, acima de 180d
- Cálculo: `DATEDIFF(DAY, DTVENCIMENTO, GETDATE())`

### RN-FIN-003: Bolsas e Descontos
- Tipos: integral (100%), parcial, mérito, social, convênio, funcionário
- Bolsa ativa: `ATIVA = 1` e `DTFIM >= data_atual`
- Máximo 1 bolsa ativa por aluno

### RN-FIN-004: Contratos Educacionais
- Status: ativo, pendente_assinatura, encerrado, cancelado
- Valor anual = parcelas × valor da parcela
- Encerramento automático ao final do ano letivo

### RN-FIN-005: Renegociação
- Agrupa 1+ parcelas vencidas em novo parcelamento
- Desconto máximo: 30% (política institucional)
- Fluxo: proposta → em_análise → aprovada/rejeitada → quitada
- Parcelas originais → status `renegociada`

### RN-FIN-006: 2ª Via de Boleto
- Somente parcelas em_dia ou vencida
- Multa: 2% + juros 1% a.m. (pro-rata)
- Validade: 30 dias

### RN-FIN-007: Relatório Mensal
- Receita prevista = soma valores originais do mês
- Receita realizada = soma valores pagos no mês
- Inadimplência = prevista - realizada

---

*Documento gerado para o projeto totvs-educacional-frontend. Atualizado em 2026-03-21 com regras financeiras. Manter sincronizado com atualizações do TOTVS RM e legislação vigente.*
