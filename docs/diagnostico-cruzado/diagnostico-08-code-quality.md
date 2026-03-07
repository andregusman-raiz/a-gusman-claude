# D08 - Code Quality & Developer Experience (DX)

**Diagnostico Cruzado: raiz-platform vs rAIz-AI-Prof**
Data: 2026-03-01 | Versao: 1.0

---

## 1. Resumo Executivo

Este diagnostico compara as praticas de qualidade de codigo e experiencia do desenvolvedor entre os dois projetos TypeScript da rAIz. Ambos os projetos compartilham fundamentos similares (Prettier, ESLint, TypeScript strict), mas divergem significativamente em maturidade de tooling, enforcement automatizado e estrategia de debt management.

| Dimensao | raiz-platform | rAIz-AI-Prof | Veredito |
|----------|--------------|--------------|----------|
| ESLint | Legacy config, regras customizadas, zero-warning | Flat config, a11y/i18n/import-sort, 500 warnings tolerados | rAIz-AI-Prof mais moderno; raiz-platform mais rigoroso |
| Prettier | Alinhado + plugin Tailwind | Alinhado (configs conflitantes) | raiz-platform mais limpo |
| Pre-commit | husky + lint-staged (eslint+prettier) | husky + lint-staged + commitlint + export-validate | rAIz-AI-Prof mais completo |
| Commit conventions | Manual/cultural | commitlint automatizado | rAIz-AI-Prof vence |
| Dead code | Nenhuma ferramenta | knip + depcheck + madge | rAIz-AI-Prof vence |
| Import ordering | Sem enforcement | simple-import-sort (auto-fix) | rAIz-AI-Prof vence |
| TS strictness | Strict unico, 17 ts-ignore, ~547 any | Dual-config (strict/relaxed), 99 ts-ignore, ~186 any prod | raiz-platform mais honest; rAIz-AI-Prof mais pragmatico |
| Editor config | Nenhum | Nenhum | Empate (gap em ambos) |
| Package manager | npm | npm | Alinhado |
| Dependency mgmt | 152 deps, lock file | 114 deps, lock file | Alinhado |

---

## 2. Linting: ESLint

### 2.1 Comparacao de Configuracao

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Formato** | `.eslintrc.json` (legacy) | `eslint.config.mjs` (flat config) |
| **ESLint versao** | 8.57.1 | 9.21.0 |
| **Base** | `next/core-web-vitals` + `@typescript-eslint/recommended` | `@eslint/js` recommended + `typescript-eslint` recommended |
| **Parser** | `@typescript-eslint/parser` | Via `typescript-eslint` (integrado) |
| **Max warnings** | 0 (via lint-staged) | 500 (via script), 1000 (via lint-staged) |
| **Regras custom** | `eslint-plugin-raiz` (2 regras) | Nenhuma |

### 2.2 Plugins

| Plugin | raiz-platform | rAIz-AI-Prof |
|--------|--------------|--------------|
| `@typescript-eslint` | Sim | Sim |
| `react-hooks` | Sim (via next) | Sim |
| `react-refresh` | Nao | Sim |
| `simple-import-sort` | Nao | Sim |
| `i18next` | Nao | Sim (desabilitado) |
| `jsx-a11y` | Nao | Sim (24 regras em warn) |
| `eslint-config-prettier` | Nao | Instalado, nao configurado |
| `eslint-plugin-raiz` | Sim (custom) | Nao |

### 2.3 Regras Customizadas (raiz-platform)

O `eslint-plugin-raiz` (`D:\GitHub\raiz-platform\eslint-rules\`) implementa:

1. **`raiz/no-hardcoded-colors`** (warn): Detecta cores hex hardcoded em JSX, sugere CSS variables (`var(--qi-*)`) ou Tailwind. Tem allowlist inteligente para SVG, charts, temas.
2. **`raiz/prefer-qi-components`** (warn): Sugere componentes do design system QI ao inves de HTML raw.

Estas regras sao especificas ao design system "Quiet Intelligence" e nao tem equivalente no rAIz-AI-Prof.

### 2.4 Overrides

**raiz-platform** define 3 overrides:
- `packages/cli/**`: Desativa no-console e regras de UI
- `src/components/chat/**` + `src/context/**`: Desativa prefer-qi-components, permite mais console
- `src/components/settings/**`: Desativa prefer-qi-components

**rAIz-AI-Prof** define 2 overrides:
- Arquivos de logging/security: Desativa no-console
- Arquivos de teste: Desativa no-console

### 2.5 Gaps Identificados

| Gap | Projeto | Impacto |
|-----|---------|---------|
| Legacy ESLint config (deprecated em ESLint 9) | raiz-platform | Futuro bloqueio de atualizacao |
| Sem import sorting enforcement | raiz-platform | Inconsistencia de imports |
| Sem a11y rules | raiz-platform | Acessibilidade nao verificada |
| `eslint-config-prettier` instalado mas nao usado | rAIz-AI-Prof | Possiveis conflitos ESLint/Prettier |
| Max-warnings 1000 no lint-staged (muito permissivo) | rAIz-AI-Prof | Warnings acumulam sem controle |
| Sem regras de design system enforcement | rAIz-AI-Prof | Nao ha equivalente ao prefer-qi-components |
| Plugin i18next instalado mas desabilitado | rAIz-AI-Prof | i18n nao enforcement (debt latente) |

---

## 3. Formatacao: Prettier

### 3.1 Comparacao de Configuracao

| Opcao | raiz-platform (`.prettierrc`) | rAIz-AI-Prof (`.prettierrc`) | rAIz-AI-Prof (`.prettierrc.json`) |
|-------|-------------------------------|------------------------------|-----------------------------------|
| `semi` | `true` | `true` | `true` |
| `singleQuote` | `true` | `true` | `true` |
| `tabWidth` | `2` | `2` | - |
| `trailingComma` | `"es5"` | `"es5"` | `"all"` |
| `printWidth` | `100` | `100` | `100` |
| `bracketSpacing` | default (`true`) | `true` | - |
| `arrowParens` | default (`"always"`) | `"always"` | - |
| `endOfLine` | default (`"lf"`) | `"lf"` | - |
| Plugin Tailwind | Sim | Nao | - |

### 3.2 Problema Critico: Configuracoes Duplicadas no rAIz-AI-Prof

O rAIz-AI-Prof tem **dois arquivos Prettier** com valores conflitantes:
- `.prettierrc`: `trailingComma: "es5"`
- `.prettierrc.json`: `trailingComma: "all"`

Pela [ordem de precedencia do Prettier](https://prettier.io/docs/configuration), `.prettierrc` tem prioridade sobre `.prettierrc.json`. Mas a mera existencia de dois arquivos causa confusao e pode gerar inconsistencias em editores/IDEs.

### 3.3 Plugin Tailwind

O `prettier-plugin-tailwindcss` ordena automaticamente classes Tailwind. O raiz-platform o utiliza; o rAIz-AI-Prof (que usa Tailwind 4.1) nao. Isso resulta em ordenacao inconsistente de classes no rAIz-AI-Prof.

### 3.4 Gaps Identificados

| Gap | Projeto | Impacto |
|-----|---------|---------|
| Duas configs Prettier conflitantes | rAIz-AI-Prof | Confusao, valores inconsistentes |
| Sem `prettier-plugin-tailwindcss` | rAIz-AI-Prof | Classes Tailwind desordenadas |
| Sem `endOfLine` explicito | raiz-platform | Risco de CRLF em Windows |

---

## 4. Pre-Commit Hooks

### 4.1 Comparacao

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Ferramenta** | husky 9.1.7 | husky 9.1.7 |
| **pre-commit** | `lint-staged` | `lint-staged` |
| **commit-msg** | Nenhum | `commitlint --edit` |
| **pre-push** | Nenhum | `validate:exports` + `typecheck` |
| **lint-staged config** | Em `package.json` | Em `lint-staged.config.cjs` |

### 4.2 Lint-staged: Detalhes

**raiz-platform** (`package.json`):
```json
{
  "*.{ts,tsx}": ["eslint --fix --max-warnings=0", "prettier --write"],
  "*.{js,jsx,json,css,md}": ["prettier --write"]
}
```

**rAIz-AI-Prof** (`lint-staged.config.cjs`):
```js
{
  '*.{ts,tsx}': ['eslint --fix --max-warnings=1000', 'prettier --write'],
  '**/index.ts': [() => 'node scripts/validate-exports.js'],
  '*.json': ['prettier --write'],
  '*.css': ['prettier --write'],
  '*.md': ['prettier --write'],
}
```

### 4.3 Analise de Enforcement

| Metrica | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| ESLint max-warnings no pre-commit | **0** (rigoroso) | **1000** (permissivo) |
| Validate barrel exports | Nao | Sim (pre-commit + pre-push) |
| Typecheck no pre-push | Nao | Sim |
| Format on commit | Sim | Sim |

O raiz-platform e mais rigoroso na qualidade por commit (zero warnings), mas o rAIz-AI-Prof tem mais layers de protecao (pre-push com typecheck + export validation).

### 4.4 Gaps Identificados

| Gap | Projeto | Impacto |
|-----|---------|---------|
| Sem commit-msg hook | raiz-platform | Commits nao validados automaticamente |
| Sem pre-push typecheck | raiz-platform | Erros de tipo podem chegar ao remote |
| Max-warnings 1000 no pre-commit | rAIz-AI-Prof | Permite commits com ate 1000 warnings |
| Sem export validation | raiz-platform | Duplicatas em barrels nao detectadas |

---

## 5. Commit Conventions

### 5.1 Comparacao

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Enforcement** | Cultural (docs + CLAUDE.md) | Automatizado (commitlint) |
| **Formato** | `tipo(escopo): descricao` | `tipo(escopo): descricao` |
| **Tipos aceitos** | feat, fix, refactor, docs, test, chore | feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert |
| **Ferramenta** | Nenhuma (validacao manual) | `@commitlint/cli` + `@commitlint/config-conventional` |
| **Header max length** | Nao definido | 100 chars |
| **Case enforcement** | Nao | lower-case obrigatorio |

### 5.2 Analise

O raiz-platform documenta convencoes de commit em:
- `D:\GitHub\raiz-platform\.claude\rules\commit-conventions.md`
- `D:\GitHub\raiz-platform\CLAUDE.md` (secao "Git")

Mas nao tem enforcement automatizado. Um developer ou agent pode commitar `FIX: coisa` e o hook nao bloqueara.

O rAIz-AI-Prof tem enforcement total com commitlint no hook `commit-msg`, bloqueando commits fora do padrao.

### 5.3 Gaps Identificados

| Gap | Projeto | Impacto |
|-----|---------|---------|
| Sem commitlint | raiz-platform | Convencoes dependem de disciplina |
| Tipos limitados (falta style, perf, build, ci, revert) | raiz-platform | Menor expressividade |

---

## 6. Dead Code Analysis

### 6.1 Comparacao

| Ferramenta | raiz-platform | rAIz-AI-Prof |
|------------|--------------|--------------|
| **knip** | Nao instalado | Sim (`knip.json`, `npm run analyze:knip`) |
| **depcheck** | Nao instalado | Sim (`npm run analyze:depcheck`) |
| **madge** (circular deps) | Nao instalado | Sim (`npm run analyze:madge`) |
| **Scripts de analise** | Nenhum | 3 comandos de analise |

### 6.2 Configuracao knip (rAIz-AI-Prof)

Arquivo: `D:\GitHub\rAIz-AI-Prof\knip.json`
```json
{
  "entry": ["index.html", "index.tsx"],
  "project": ["tsconfig.json"],
  "ignore": ["dist/**", "dist-ssr/**", "node_modules/**", "docs/**", "**/*.md"],
  "include": ["**/*.{ts,tsx}"]
}
```

### 6.3 Gaps Identificados

| Gap | Projeto | Impacto |
|-----|---------|---------|
| Sem nenhuma ferramenta de dead code | raiz-platform | 109 deps + 3962 arquivos sem verificacao de uso |
| Sem deteccao de circular imports | raiz-platform | Dependencias ciclicas nao detectadas |
| `knip.json` basico, sem `ignoreDependencies` customizado | rAIz-AI-Prof | Falsos positivos possiveis |

---

## 7. Import Ordering

### 7.1 Comparacao

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Plugin** | Nenhum | `eslint-plugin-simple-import-sort` |
| **Enforcement** | Nenhum | `warn` (auto-fixavel) |
| **Ferramenta adicional** | Nenhum | `organize-imports-cli` (devDep) |
| **Import groups** | Convencao cultural | Automatizado por ESLint |

### 7.2 Analise

O `simple-import-sort` no rAIz-AI-Prof ordena automaticamente imports em grupos (builtin > external > internal > relative) e exports. Com `eslint --fix`, a ordenacao e aplicada automaticamente no pre-commit.

O raiz-platform nao tem enforcement nenhum. Imports sao organizados por convencao do developer, sem consistencia garantida.

### 7.3 Gaps Identificados

| Gap | Projeto | Impacto |
|-----|---------|---------|
| Sem import sorting | raiz-platform | Imports inconsistentes entre arquivos |
| `organize-imports-cli` instalado mas sem script | rAIz-AI-Prof | Ferramenta redundante/nao usada |

---

## 8. TypeScript Strictness

### 8.1 Comparacao de tsconfig

| Opcao | raiz-platform | rAIz-AI-Prof (IDE) | rAIz-AI-Prof (CI) |
|-------|--------------|--------------------|--------------------|
| **strict** | `true` | `true` | `false` |
| **noImplicitAny** | via strict | via strict | `false` |
| **strictNullChecks** | via strict | via strict | `false` |
| **strictPropertyInit** | via strict | via strict | `false` |
| **noUnusedLocals** | default (false) | `true` | `false` |
| **noUnusedParameters** | default (false) | `true` | `false` |
| **noFallthroughCases** | default (false) | `true` | default |
| **forceConsistentCasing** | default (false) | `true` | default |
| **Target** | ES2022 | ES2022 | ES2022 |
| **Module** | ESNext | ESNext | ESNext |
| **Incremental** | `true` | Nao | Sim (config separado) |

### 8.2 Estrategia de Type Debt

| Metrica | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Configs** | 1 (tudo strict) | 3 (strict IDE, relaxed CI, incremental) |
| **Estrategia** | Strict unico, zero tolerance | Dual-config, debt gradual |
| **Strict errors** | 0 (CI bloqueante) | ~677 (apenas no strict) |
| **CI gate** | `npx tsc --noEmit` (strict) | `tsc -p tsconfig.typecheck.json` (relaxed) |
| **`@ts-ignore`/`@ts-expect-error`** | 17 (8 arquivos) | 99 (30 arquivos) |
| **`any` em producao** | ~547 ocorrencias | ~186 ocorrencias |
| **`any` total (com testes)** | ~1262 ocorrencias | ~225 ocorrencias |
| **Arquivos fonte** | ~3962 | ~2970 |
| **Ratio any/arquivo** | 0.14 (prod) | 0.06 (prod) |

### 8.3 Analise

O raiz-platform adota uma abordagem "tudo strict" mas com mais `any` em codigo de producao (~547 vs ~186). A ratio `any/arquivo` e 2.3x maior no raiz-platform.

O rAIz-AI-Prof usa uma abordagem pragmatica com dual-config: strict para IDE (detecta problemas enquanto digita) e relaxado para CI (nao bloqueia build). Os ~677 erros strict sao debt documentado em `docs/TYPESCRIPT_DEBT_BACKLOG.md`.

Apesar de ter mais `@ts-ignore` (99 vs 17), a maioria esta em arquivos de teste (validadores), o que e aceitavel.

### 8.4 Scripts de TypeCheck (rAIz-AI-Prof)

O rAIz-AI-Prof tem 6 scripts de typecheck:
- `typecheck` - Relaxed (CI gate)
- `typecheck:full` - Strict (~677 erros)
- `typecheck:incremental` - Fast check
- `typecheck:analyze` - Analisa e categoriza erros
- `typecheck:fix` - Auto-fix de erros comuns
- `typecheck:auto-fix` - Auto-fix agressivo

O raiz-platform tem apenas `npx tsc --noEmit` (via convencao no CLAUDE.md, sem script dedicado).

### 8.5 Gaps Identificados

| Gap | Projeto | Impacto |
|-----|---------|---------|
| Sem script `typecheck` no package.json | raiz-platform | Depende de convencao, nao de script |
| Alta density de `any` em prod (0.14/arquivo) | raiz-platform | Type safety reduzida |
| CI usa config relaxado (strict=false) | rAIz-AI-Prof | ~677 erros escondidos em CI |
| Sem `noUnusedLocals`/`noUnusedParameters` | raiz-platform | Dead code/params nao detectados pelo TS |
| Sem `forceConsistentCasingInFileNames` | raiz-platform | Riscos em CI Linux (case-sensitive) |
| Sem `noFallthroughCasesInSwitch` | raiz-platform | Switch sem break nao detectado |

---

## 9. Editor Configuration

### 9.1 Comparacao

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| `.editorconfig` | Nao | Nao |
| `.vscode/settings.json` | Nao | Nao |
| `.vscode/extensions.json` | Nao | Nao |

### 9.2 Analise

Nenhum dos projetos tem configuracao de editor compartilhada. Isso significa:
- Cada developer usa suas proprias settings de VSCode
- Sem formatacao automatica on save
- Sem recomendacao de extensoes
- Indentacao pode variar (tab vs space) entre editors nao-VSCode

O Prettier resolve parcialmente isso no commit (via lint-staged), mas a experiencia no editor e inconsistente.

### 9.3 Gaps Identificados

| Gap | Projeto | Impacto |
|-----|---------|---------|
| Sem `.editorconfig` | Ambos | Inconsistencia entre editores |
| Sem `.vscode/settings.json` | Ambos | Sem format-on-save padronizado |
| Sem `.vscode/extensions.json` | Ambos | Onboarding manual de extensoes |

---

## 10. Package Manager & Dependency Management

### 10.1 Comparacao

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Package manager** | npm | npm |
| **Lock file** | `package-lock.json` | `package-lock.json` |
| **Node version pinning** | `.nvmrc` (20.19.0) | `engines` (20.x) |
| **Dependencies** | 109 prod + 43 dev = 152 | 51 prod + 63 dev = 114 |
| **Overrides** | 3 | 7 |
| **Optional deps** | 5 | 0 |
| **Side effects** | Nao declarado | Declarado (`sideEffects` em package.json) |
| **TypeScript** | 5.7.2 | 5.9.3 |

### 10.2 Ferramentas de Analise de Dependencias

| Ferramenta | raiz-platform | rAIz-AI-Prof |
|------------|--------------|--------------|
| depcheck | Nao | Sim |
| knip | Nao | Sim |
| madge | Nao | Sim |
| Bundle analyzer | `@next/bundle-analyzer` | `rollup-plugin-visualizer` |
| TypeDoc | Nao | Sim |
| Storybook | Nao | Sim (v10.1.11) |

### 10.3 Analise

O raiz-platform tem 33% mais dependencias totais (152 vs 114), sem nenhuma ferramenta para auditar se todas estao em uso. Dado o tamanho do projeto (3962 arquivos), a probabilidade de dependencias orfas e alta.

O rAIz-AI-Prof tem mais devDependencies (63 vs 43) porque investe em tooling de qualidade: knip, depcheck, madge, Storybook, TypeDoc, a11y tools, organize-imports-cli, color-contrast-checker, pa11y, etc.

### 10.4 Gaps Identificados

| Gap | Projeto | Impacto |
|-----|---------|---------|
| Sem depcheck/knip | raiz-platform | Deps orfas nao detectadas |
| Mais overrides (7) com deps de seguranca | rAIz-AI-Prof | Manutencao extra |
| `.nvmrc` nao alinhado com `engines` | Inconsistencia | raiz-platform: exato; rAIz-AI-Prof: range |
| Sem `sideEffects` | raiz-platform | Tree-shaking menos eficiente |

---

## 11. Ferramentas Exclusivas por Projeto

### 11.1 raiz-platform Exclusivo

| Ferramenta/Config | Descricao | Valor |
|-------------------|-----------|-------|
| `eslint-plugin-raiz` | 2 regras custom (cores, componentes QI) | Alto - design system enforcement |
| `.agents/skills/` | Sistema de skills para Claude Code | DX especifica para AI-assisted dev |
| `CLAUDE.md` extenso | 400+ linhas de convencoes | Documentacao rica para AI |
| Monorepo `packages/cli` | CLI package interno | Organizacao de ferramentas |
| `promptfoo` | Teste de prompts LLM | Qualidade de AI outputs |

### 11.2 rAIz-AI-Prof Exclusivo

| Ferramenta/Config | Descricao | Valor |
|-------------------|-----------|-------|
| knip + depcheck + madge | Triple dead-code analysis | Alto - higiene de codigo |
| Storybook 10 | Component dev/docs | Alto - DX de UI |
| TypeDoc | API documentation gen | Medio - docs automaticas |
| pa11y + @axe-core | A11y testing | Alto - acessibilidade |
| commitlint | Commit validation | Medio - consistencia |
| eslint-plugin-jsx-a11y | 24 regras de a11y | Alto - acessibilidade |
| simple-import-sort | Auto-fix imports | Medio - consistencia |
| i18next + plugins | Internacionalizacao | Medio - futuro i18n |
| 6 scripts typecheck | Gestao granular de TS debt | Alto - pragmatismo |
| pre-push hooks | typecheck + export validate | Alto - seguranca |
| color-contrast-checker | A11y de cores | Baixo - nicho |

---

## 12. Metricas de Qualidade

### 12.1 Tabela Consolidada

| Metrica | raiz-platform | rAIz-AI-Prof | Melhor |
|---------|--------------|--------------|--------|
| Arquivos fonte (.ts/.tsx) | 3962 | 2970 | - |
| `any` em producao | ~547 | ~186 | rAIz-AI-Prof |
| `any` ratio por arquivo | 0.14 | 0.06 | rAIz-AI-Prof |
| `@ts-ignore`/`@ts-expect-error` | 17 | 99 | raiz-platform |
| `@ts-ignore` em prod (excl. testes) | ~5 | ~4 | Empate |
| ESLint max-warnings (pre-commit) | 0 | 1000 | raiz-platform |
| ESLint max-warnings (script) | N/A (next lint) | 500 | raiz-platform |
| Regras ESLint unicas | 7 | ~35 | rAIz-AI-Prof |
| Plugins ESLint | 2 | 6 | rAIz-AI-Prof |
| Pre-commit layers | 1 (lint-staged) | 1 (lint-staged) | Empate |
| Pre-push layers | 0 | 2 (exports + typecheck) | rAIz-AI-Prof |
| Dead code tools | 0 | 3 (knip+depcheck+madge) | rAIz-AI-Prof |
| Custom ESLint rules | 2 | 0 | raiz-platform |
| A11y enforcement | 0 regras | 24 regras | rAIz-AI-Prof |
| Commit validation | Manual | Automatizado | rAIz-AI-Prof |
| Dual TS config | Nao | Sim (3 configs) | Depende da perspectiva |
| Bundle analysis | Sim | Sim | Empate |
| Component playground | Nao | Storybook | rAIz-AI-Prof |

---

## 13. Oportunidades Priorizadas

### P0 - Criticas (implementar imediatamente)

| # | Oportunidade | Projeto | Justificativa | Esforco |
|---|-------------|---------|---------------|---------|
| P0-1 | Remover `.prettierrc.json` duplicado | rAIz-AI-Prof | Configs conflitantes (`trailingComma: "all"` vs `"es5"`) | 5 min |
| P0-2 | Ativar `eslint-config-prettier` no ESLint | rAIz-AI-Prof | Instalado mas nao usado; risco de conflitos ESLint/Prettier | 15 min |
| P0-3 | Adicionar script `typecheck` ao raiz-platform | raiz-platform | Hoje depende de convencao, nao de script padronizado | 5 min |
| P0-4 | Reduzir `max-warnings` no lint-staged do rAIz-AI-Prof | rAIz-AI-Prof | 1000 warnings e nao-enforcement; reduzir para 500 e entao gradualmente | 5 min |

### P1 - Importantes (proximo sprint)

| # | Oportunidade | Projeto | Justificativa | Esforco |
|---|-------------|---------|---------------|---------|
| P1-1 | Instalar `commitlint` no raiz-platform | raiz-platform | Convencoes de commit nao enforcement; template ja existe em `.agents/skills/` | 2h |
| P1-2 | Adicionar `simple-import-sort` ao raiz-platform | raiz-platform | 3962 arquivos sem import ordering consistente | 1h |
| P1-3 | Adicionar `prettier-plugin-tailwindcss` ao rAIz-AI-Prof | rAIz-AI-Prof | Usa Tailwind 4.1 sem class sorting | 30 min |
| P1-4 | Criar `.editorconfig` padrao para ambos | Ambos | Nenhum projeto tem; essencial para multi-editor | 30 min |
| P1-5 | Adicionar `endOfLine: "lf"` ao Prettier do raiz-platform | raiz-platform | Windows dev sem enforcement de line endings | 5 min |
| P1-6 | Adicionar `noFallthroughCasesInSwitch` ao tsconfig do raiz-platform | raiz-platform | Flag de seguranca basica ausente | 5 min |
| P1-7 | Adicionar pre-push hook com typecheck ao raiz-platform | raiz-platform | rAIz-AI-Prof ja tem; raiz-platform empurra erros de tipo ao remote | 1h |

### P2 - Desejavel (proximo mes)

| # | Oportunidade | Projeto | Justificativa | Esforco |
|---|-------------|---------|---------------|---------|
| P2-1 | Instalar knip no raiz-platform | raiz-platform | 152 deps sem verificacao de uso; alto risco de orfas | 2h |
| P2-2 | Migrar ESLint para flat config no raiz-platform | raiz-platform | Legacy config deprecated; ESLint 9+ requer flat config | 4h |
| P2-3 | Adicionar `jsx-a11y` ao raiz-platform | raiz-platform | Zero enforcement de acessibilidade | 2h |
| P2-4 | Criar `.vscode/settings.json` e `extensions.json` para ambos | Ambos | Format-on-save, extensoes recomendadas | 1h |
| P2-5 | Adicionar `noUnusedLocals`/`noUnusedParameters` ao tsconfig do raiz-platform | raiz-platform | Dead code/params nao detectados | 4h (cleanup) |
| P2-6 | Reduzir TS strict debt no rAIz-AI-Prof | rAIz-AI-Prof | 677 erros strict acumulados | 8h+ |
| P2-7 | Instalar `madge` no raiz-platform | raiz-platform | Sem deteccao de circular imports | 1h |
| P2-8 | Adicionar `forceConsistentCasingInFileNames` ao raiz-platform | raiz-platform | Risco em deploy Linux (case-sensitive) | 5 min + cleanup |

### P3 - Nice-to-have (backlog)

| # | Oportunidade | Projeto | Justificativa | Esforco |
|---|-------------|---------|---------------|---------|
| P3-1 | Instalar Storybook no raiz-platform | raiz-platform | DX de componentes UI | 4h+ |
| P3-2 | Portar regras `eslint-plugin-raiz` para rAIz-AI-Prof | rAIz-AI-Prof | Se adotar design system compartilhado | 2h |
| P3-3 | Adicionar TypeDoc ao raiz-platform | raiz-platform | Documentacao de API automatica | 2h |
| P3-4 | Unificar scripts de analise entre projetos | Ambos | Scripts padronizados de qualidade | 4h |
| P3-5 | Investigar `sideEffects` para raiz-platform | raiz-platform | Tree-shaking otimizado para Next.js | 2h |
| P3-6 | Reduzir `any` ratio no raiz-platform | raiz-platform | 0.14 any/arquivo vs 0.06 no rAIz-AI-Prof | 16h+ |

---

## 14. Padroes Reutilizaveis

### 14.1 De rAIz-AI-Prof para raiz-platform

1. **Triple dead-code analysis**: Instalar knip + depcheck + madge com scripts identicos
2. **Commitlint config**: Copiar `commitlint.config.cjs` (ja existe template em `.agents/skills/`)
3. **Pre-push hook**: Copiar hook de typecheck + export validation
4. **Import sorting**: Instalar `eslint-plugin-simple-import-sort` com mesmas regras
5. **Dual tsconfig strategy**: Considerar para gerenciar debt gradualmente
6. **A11y rules**: Copiar config de `jsx-a11y` do `eslint.config.mjs`

### 14.2 De raiz-platform para rAIz-AI-Prof

1. **Zero-warning policy**: Reduzir gradualmente `max-warnings` ate 0
2. **Custom ESLint plugin**: Template para criar regras especificas do design system
3. **Prettier plugin Tailwind**: Instalar `prettier-plugin-tailwindcss`
4. **CLAUDE.md pattern**: Documentacao rica de convencoes para AI-assisted dev

### 14.3 Configuracao Compartilhada Proposta

Para alinhar ambos os projetos, criar um pacote ou repositorio compartilhado com:

```
shared-config/
  .editorconfig              # Universal
  .prettierrc                # Alinhado (semi, singleQuote, tabWidth 2, es5, 100)
  commitlint.config.cjs      # Conventional commits
  tsconfig.base.json         # Opcoes compartilhadas
  eslint-shared-rules.mjs    # Regras comuns
```

---

## 15. Arquivos de Referencia

### raiz-platform
| Arquivo | Caminho Absoluto |
|---------|-----------------|
| ESLint config | `D:\GitHub\raiz-platform\.eslintrc.json` |
| Custom ESLint rules | `D:\GitHub\raiz-platform\eslint-rules\index.js` |
| Prettier config | `D:\GitHub\raiz-platform\.prettierrc` |
| Prettier ignore | `D:\GitHub\raiz-platform\.prettierignore` |
| TypeScript config | `D:\GitHub\raiz-platform\tsconfig.json` |
| Husky pre-commit | `D:\GitHub\raiz-platform\.husky\pre-commit` |
| Package.json (lint-staged) | `D:\GitHub\raiz-platform\package.json` |
| Node version | `D:\GitHub\raiz-platform\.nvmrc` |
| Commit conventions | `D:\GitHub\raiz-platform\.claude\rules\commit-conventions.md` |

### rAIz-AI-Prof
| Arquivo | Caminho Absoluto |
|---------|-----------------|
| ESLint config (flat) | `D:\GitHub\rAIz-AI-Prof\eslint.config.mjs` |
| Prettier config | `D:\GitHub\rAIz-AI-Prof\.prettierrc` |
| Prettier config (duplicada!) | `D:\GitHub\rAIz-AI-Prof\.prettierrc.json` |
| Prettier ignore | `D:\GitHub\rAIz-AI-Prof\.prettierignore` |
| TypeScript config (strict/IDE) | `D:\GitHub\rAIz-AI-Prof\tsconfig.json` |
| TypeScript config (relaxed/CI) | `D:\GitHub\rAIz-AI-Prof\tsconfig.typecheck.json` |
| TypeScript config (strict full) | `D:\GitHub\rAIz-AI-Prof\tsconfig.strict.json` |
| TypeScript config (incremental) | `D:\GitHub\rAIz-AI-Prof\tsconfig.incremental.json` |
| Commitlint config | `D:\GitHub\rAIz-AI-Prof\commitlint.config.cjs` |
| Lint-staged config | `D:\GitHub\rAIz-AI-Prof\lint-staged.config.cjs` |
| Knip config | `D:\GitHub\rAIz-AI-Prof\knip.json` |
| Husky pre-commit | `D:\GitHub\rAIz-AI-Prof\.husky\pre-commit` |
| Husky commit-msg | `D:\GitHub\rAIz-AI-Prof\.husky\commit-msg` |
| Husky pre-push | `D:\GitHub\rAIz-AI-Prof\.husky\pre-push` |
| Storybook config | `D:\GitHub\rAIz-AI-Prof\.storybook\main.ts` |

---

## 16. Conclusao

O **rAIz-AI-Prof** esta significativamente mais avancado em tooling de qualidade e DX, com mais ferramentas (knip, depcheck, madge, commitlint, Storybook, TypeDoc, pa11y), mais plugins ESLint (6 vs 2), mais hooks git (3 vs 1), e melhor cobertura de preocupacoes (a11y, imports, dead code).

O **raiz-platform** compensa com maior rigor onde atua: zero-warning policy no ESLint, strict mode unico sem escape-hatch, e regras customizadas para design system. Sua documentacao de convencoes (CLAUDE.md, rules/) e mais rica.

A maior oportunidade de convergencia esta em:
1. **Trazer tooling do rAIz-AI-Prof para o raiz-platform** (commitlint, knip, import sorting, a11y, pre-push hooks)
2. **Trazer rigor do raiz-platform para o rAIz-AI-Prof** (reduzir max-warnings, ativar eslint-config-prettier, limpar Prettier duplicado)
3. **Criar configuracao compartilhada** para garantir alinhamento continuo entre os projetos
