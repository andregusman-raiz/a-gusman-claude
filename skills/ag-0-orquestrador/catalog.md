# ag-0-orquestrador — Machine & Agent Catalog

## 9 Machines (User-Facing)

| Machine | Comando | Modos | Agents internos |
|---------|---------|-------|-----------------|
| **ag-1-construir** | `/construir` | feature, issue, refactor, otimizar, ui, integrar | ag-especificar-solucao, P-07, B-08, B-10, B-11, B-52, Q-12, Q-13, Q-14, D-18, I-32→35, M-51 |
| **ag-2-corrigir** | `/corrigir` | bug, tipos, batch, debt, triage | ag-depurar-erro, B-23, B-53 |
| **ag-3-entregar** | `/entregar` | preview, producao, rollback | ag-versionar-codigo, D-27, D-38, D-19, D-20 |
| **ag-4-teste-final** | `/teste-final` | qat, ux-qat, benchmark, ciclo, e2e | ag-testar-qualidade-qat, Q-41, Q-42, Q-43, Q-44, Q-45, Q-39, Q-51 |
| **ag-5-documentos** | `/documentos` | projeto, office, organizar, ortografia | ag-documentar-projeto, W-29, W-30, W-31 |
| **ag-6-iniciar** | `/iniciar` | projeto, ambiente, explorar, pesquisar | ag-criar-projeto, P-02, P-03, P-05 |
| **ag-7-qualidade** | `/qualidade` | (wrapper MERIDIAN) | ag-meridian |
| **ag-8-seguranca** | `/seguranca` | (wrapper SENTINEL) | ag-sentinel |
| **ag-9-auditar** | `/auditar` | (wrapper FORTRESS) | ag-fortress → M-60, Q-61, Q-62, Q-63, Q-64 |

## Shortcuts (Machine-Based)

| Sinal do usuario | Machine | Modo |
|------------------|---------|------|
| "adicionar feature X" | `/construir` | feature |
| "resolver issue #42" | `/ag-1-construir issue #42` | issue |
| "refatorar modulo Y" | `/ag-1-construir refatorar Y` | refactor |
| "otimizar queries" | `/ag-1-construir otimizar queries` | optimize |
| "redesign tela Z" | `/ag-1-construir ui Z` | ui |
| "integrar sistema W" | `/ag-1-construir integrar W` | integrate |
| "prototipar com mock" | `/construir` (mock-first) | feature |
| "bug no login" | `/ag-2-corrigir login nao funciona` | bug |
| "erros TypeScript" | `/ag-2-corrigir tipos` | tipos |
| "lista de bugs" | `/ag-2-corrigir lista: [bugs]` | batch |
| "tech debt" | `/ag-2-corrigir debt [area]` | debt |
| "deploy" | `/entregar` | preview |
| "deploy producao" | `/ag-3-entregar producao` | producao |
| "rollback" | `/ag-3-entregar rollback` | rollback |
| "QAT" | `/ag-4-teste-final qat [path]` | qat |
| "UX-QAT" | `/ag-4-teste-final ux-qat [url]` | ux-qat |
| "benchmark" | `/ag-4-teste-final benchmark [url]` | benchmark |
| "test-fix-retest" | `/ag-4-teste-final ciclo [path]` | ciclo |
| "E2E completo" | `/ag-4-teste-final e2e [path]` | e2e |
| "documentar" | `/ag-5-documentos projeto [path]` | projeto |
| "slides" / "pptx" | `/ag-5-documentos office [desc]` | office |
| "organizar arquivos" | `/ag-5-documentos organizar [path]` | organizar |
| "ortografia" | `/ag-5-documentos ortografia [path]` | ortografia |
| "novo projeto" | `/ag-6-iniciar projeto [desc]` | projeto |
| "setup ambiente" | `/ag-6-iniciar ambiente [path]` | ambiente |
| "explorar codebase" | `/ag-6-iniciar explorar [path]` | explorar |
| "pesquisar alternativas" | `/ag-6-iniciar pesquisar [tema]` | pesquisar |
| "qualidade" / "QA completo" | `/ag-7-qualidade [url/path]` | — |
| "seguranca" / "security" | `/ag-8-seguranca [url/path]` | — |
| "auditoria completa" | `/ag-9-auditar [url/path]` | — |
| "health check" | ag-saude-sessao (direto, sem machine) | — |
| "criar skill" | ag-criar-skill (direto, sem machine) | — |
| "retrospectiva" | ag-retrospectiva (direto, sem machine) | — |

## Agents Individuais (Power User — backward compatible)

Todos os 52 agents originais continuam disponiveis via `/ag-X-NN-nome`.

### P — Planning
| ID | Nome | Absorvido por |
|----|------|---------------|
| ag-criar-projeto | iniciar-projeto | ag-6-iniciar |
| ag-preparar-ambiente | setup-ambiente | ag-6-iniciar |
| ag-explorar-codigo | explorar-codigo | ag-6-iniciar |
| ag-analisar-contexto | analisar-contexto | (independente) |
| ag-pesquisar-referencia | pesquisar-referencia | ag-6-iniciar |
| ag-especificar-solucao | especificar-solucao | ag-1-construir |
| ag-planejar-execucao | planejar-execucao | ag-1-construir |

### B — Build
| ID | Nome | Absorvido por |
|----|------|---------------|
| ag-implementar-codigo | construir-codigo | ag-1-construir |
| ag-depurar-erro | depurar-erro | ag-2-corrigir |
| ag-refatorar-codigo | refatorar-codigo | ag-1-construir (refactor) |
| ag-otimizar-codigo | otimizar-codigo | ag-1-construir (optimize) |
| ag-corrigir-bugs | bugfix | ag-2-corrigir |
| ag-construir-validado | construir-validado | ag-1-construir (advanced) |
| ag-11-ux-ui | design-ui-ux | ag-1-construir (ui) |
| ag-corrigir-tipos | fix-typescript | ag-2-corrigir (tipos) |

### Q — Quality
| ID | Nome | Absorvido por |
|----|------|---------------|
| ag-validar-execucao | validar-execucao | ag-1-construir (VERIFY) |
| ag-testar-codigo | testar-codigo | ag-1-construir (VERIFY) |
| ag-revisar-codigo | criticar-projeto | ag-1-construir (REVIEW) |
| ag-verificar-seguranca | auditar-codigo | ag-1-construir (REVIEW) |
| ag-revisar-ux | revisar-ux | ag-1-construir (REVIEW ui) |
| ag-testar-e2e | testar-e2e | ag-4-teste-final |
| ag-testar-manual | testar-manual-mcp | (independente) |
| ag-ciclo-testes | ciclo-teste-completo | ag-4-teste-final (ciclo) |
| ag-testar-qualidade-qat | testar-qualidade | ag-4-teste-final (qat) |
| ag-criar-cenario-qat | criar-cenario-qat | ag-4-teste-final (qat) |
| ag-testar-ux-qualidade | testar-ux-qualidade | ag-4-teste-final (ux-qat) |
| ag-criar-cenario-ux-qat | criar-cenario-ux-qat | ag-4-teste-final (ux-qat) |
| ag-benchmark-qualidade | benchmark-qualidade | ag-4-teste-final (benchmark) |
| ag-criar-cenario-benchmark | criar-cenario-benchmark | ag-4-teste-final (benchmark) |
| ag-testar-e2e-batch | testar-e2e-batch | ag-4-teste-final (e2e) |
| ag-sentinel | sentinel | ag-8-seguranca |
| ag-avaliar-arquitetura | architect | ag-9-auditar |
| ag-avaliar-experiencia | conductor | ag-9-auditar |
| ag-avaliar-observabilidade | lighthouse | ag-9-auditar |

### D — Deploy
| ID | Nome | Absorvido por |
|----|------|---------------|
| ag-migrar-dados | migrar-dados | (independente) |
| ag-versionar-codigo | versionar-codigo | ag-1-construir + ag-3-entregar |
| ag-publicar-deploy | publicar-deploy | ag-3-entregar |
| ag-monitorar-producao | monitorar-producao | ag-3-entregar |
| ag-pipeline-deploy | deploy-pipeline | ag-3-entregar |
| ag-smoke-vercel | smoke-vercel | ag-3-entregar |

### W — Writing
| ID | Nome | Absorvido por |
|----|------|---------------|
| ag-documentar-projeto | documentar-projeto | ag-5-documentos |
| ag-gerar-documentos | gerar-documentos | ag-5-documentos |
| ag-organizar-arquivos | organizar-arquivos | ag-5-documentos |
| ag-revisar-ortografia | revisar-ortografia | ag-5-documentos |

### I — Integration
| ID | Nome | Absorvido por |
|----|------|---------------|
| ag-avaliar-software | due-diligence | ag-1-construir (integrate) |
| ag-mapear-integracao | mapear-integracao | ag-1-construir (integrate) |
| ag-planejar-incorporacao | planejar-incorporacao | ag-1-construir (integrate) |
| ag-incorporar-modulo | incorporar-modulo | ag-1-construir (integrate) |

### M — Meta (NAO absorvidos — continuam independentes)
| ID | Nome | Uso |
|----|------|-----|
| ag-0-orquestrador | orquestrar | Entry point (este arquivo) |
| ag-saude-sessao | saude-sessao | `/ag-saude-sessao` direto |
| ag-criar-agente | criar-agente | `/ag-criar-agente` direto |
| ag-retrospectiva | retrospectiva | `/ag-retrospectiva` direto |
| ag-criar-skill | criar-skill | `/ag-criar-skill` direto |
| ag-registrar-issue | registrar-issue | Chamado por outras machines |
| ag-meridian | meridian | Via `/qualidade` |
| ag-fortress | fortress | Via `/auditar` |
| ag-melhorar-agentes | melhorar-agentes | `/ag-melhorar-agentes` direto |

### R — Reference (context-only, NAO absorvidos)
ag-referencia-nextjs (Next.js) | ag-referencia-typescript (TypeScript) | ag-referencia-python (Python) | ag-referencia-supabase (Supabase) | ag-referencia-qualidade (Quality Gates) | ag-referencia-sdd (SDD) | ag-referencia-seguranca-rules (Security) | ag-referencia-mock-first (Mock-First)

## Plugin Commands (complementam machines)

| Plugin | Command | Quando usar |
|--------|---------|------------|
| code-review | `/code-review` | Review rapido < 10 arquivos |
| pr-review-toolkit | `/review-pr` | Review detalhado por aspecto |
| commit-commands | `/commit`, `/commit-push-pr`, `/clean_gone` | Git rapido (sem branch-guard) |
| feature-dev | `/feature-dev` | Feature self-contained sem pipeline |
| vercel | `/deploy` | Deploy rapido sem pipeline |
| sentry | `/seer` | Debug producao |
| slack | `/summarize-channel`, `/standup` | Comunicacao |
| figma | `implement-design` | Design → codigo |
