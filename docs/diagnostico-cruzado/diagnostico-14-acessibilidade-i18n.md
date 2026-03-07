# Diagnostico 14 — Acessibilidade & Internacionalizacao (i18n)

> Analise cruzada: **raiz-platform** (Next.js 14) vs **rAIz-AI-Prof** (Vite 7 + React 19)
> Data: 2026-03-01

---

## 1. Resumo Executivo

| Dimensao | raiz-platform | rAIz-AI-Prof |
|----------|--------------|--------------|
| **Maturidade A11y** | Media | Alta |
| **Maturidade i18n** | Inexistente | Alta (infraestrutura), Media (adocao) |
| **WCAG Target** | AA (parcial) | AA (sistematico) |
| **Idiomas** | pt-BR (hardcoded) | pt-BR, en-US, es-ES |
| **RTL** | Nenhum | Infraestrutura completa |

O rAIz-AI-Prof apresenta uma infraestrutura significativamente mais madura tanto em acessibilidade quanto em internacionalizacao. O raiz-platform tem fundamentos solidos (design system QI com testes axe-core) mas carece de sistematizacao e nao possui nenhuma infraestrutura de i18n.

---

## 2. A11y Linting — Plugin jsx-a11y

### Comparacao

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Plugin jsx-a11y** | Indireta (via `next/core-web-vitals`) | Explicita (`eslint-plugin-jsx-a11y`) |
| **Regras configuradas** | 5 regras (minimo do Next.js) | 22 regras explicitas |
| **Nivel** | warn (implicito) | warn (explicito, pronto para error) |
| **Plugin i18next** | Nao | Sim (`eslint-plugin-i18next`) |

### Detalhes raiz-platform

Arquivo: `D:\GitHub\raiz-platform\.eslintrc.json`

O ESLint herda `next/core-web-vitals` que inclui automaticamente jsx-a11y com apenas 5 regras:
- `jsx-a11y/alt-text`
- `jsx-a11y/aria-props`
- `jsx-a11y/aria-proptypes`
- `jsx-a11y/aria-unsupported-elements`
- `jsx-a11y/role-has-required-aria-props`
- `jsx-a11y/role-supports-aria-props`

Nao configura explicitamente nenhuma regra adicional de acessibilidade.

### Detalhes rAIz-AI-Prof

Arquivo: `D:\GitHub\rAIz-AI-Prof\eslint.config.mjs`

22 regras jsx-a11y configuradas explicitamente (linhas 104-127):
- `alt-text`, `anchor-has-content`, `anchor-is-valid`
- `aria-props`, `aria-proptypes`, `aria-role`, `aria-unsupported-elements`
- `click-events-have-key-events`, `heading-has-content`, `html-has-lang`
- `img-redundant-alt`, `interactive-supports-focus`
- `label-has-associated-control` (OFF — falsos positivos com Radix UI)
- `no-autofocus`, `no-noninteractive-element-interactions`, `no-noninteractive-tabindex`
- `no-redundant-roles`, `no-static-element-interactions`
- `role-has-required-aria-props`, `role-supports-aria-props`, `tabindex-no-positive`

### Gap Identificado

O raiz-platform **nao tem** regras criticas como `click-events-have-key-events`, `interactive-supports-focus`, `no-static-element-interactions`, e `heading-has-content`. Isso significa que divs com onClick sem handler de teclado passam pelo lint sem aviso.

---

## 3. A11y Testing

### Comparacao

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Unit (axe-core)** | jest-axe (12 componentes QI) | Vitest + mocks manuais |
| **E2E (Playwright+axe)** | Nao | @axe-core/playwright (7 testes) |
| **pa11y** | Nao | Sim (script + E2E) |
| **Storybook a11y** | Nao | @storybook/addon-a11y |
| **Auditoria estatica** | Nao | `scripts/a11y-audit.js` |
| **WCAG tags** | Nao especificado | `wcag2a`, `wcag2aa` explicitamente |

### raiz-platform — Testes A11y

**1 arquivo de teste unitario** com axe-core:
- `D:\GitHub\raiz-platform\src\components\qi\__tests__\accessibility.test.tsx`
- Testa 12 componentes do design system QI: Button, Input, Textarea, Select, Checkbox, Switch, Alert, Card, Modal, Tabs, Table, Sidebar
- Usa `jest-axe` com `toHaveNoViolations()`

**1 arquivo de teste de acessibilidade de componente especifico**:
- `D:\GitHub\raiz-platform\src\components\totvs-sql\__tests__\DataProductCard.accessibility.test.tsx`
- Testa role="button", tabIndex, keyboard handlers (Enter/Space)

### rAIz-AI-Prof — Testes A11y

**Testes unitarios** (`D:\GitHub\rAIz-AI-Prof\test\a11y.test.tsx`):
- Mock components para button, input, modal, alert, loading skeleton
- Verifica ARIA attributes, roles, keyboard navigation, landmarks
- **Nao usa axe-core diretamente** nos testes unitarios (apenas mocks manuais)

**Testes E2E** (`D:\GitHub\rAIz-AI-Prof\test\e2e\accessibility.e2e.test.ts`):
- 7 testes com `@axe-core/playwright` (AxeBuilder)
- Login page: wcag2a + wcag2aa full scan
- Home page: critical/serious violations
- Questoes page: heading structure validation
- Forms: label association check
- Keyboard navigation: tab through 20 elements
- Images: alt text verification
- Color contrast: wcag2aa com exclusao de debt conhecido

**Script de auditoria** (`D:\GitHub\rAIz-AI-Prof\scripts\a11y-audit.js`):
- Analise estatica: contrast, labels, ARIA, keyboard navigation
- Integracao com pa11y para scan dinamico
- Gera relatorios JSON priorizados (critical/high/medium/low)
- Mapeia criterios WCAG: 1.4.3, 1.4.11, 3.3.2, 4.1.2, 2.1.1, 2.4.3

**Storybook**:
- `@storybook/addon-a11y` configurado em `D:\GitHub\rAIz-AI-Prof\.storybook\main.ts`
- Stories para AccessibleTextarea

---

## 4. WCAG Compliance Assessment

### Comparacao por Criterio

| Criterio WCAG | raiz-platform | rAIz-AI-Prof |
|---------------|--------------|--------------|
| **1.1.1** Texto Alternativo | Parcial (lint warn) | Sistematico (lint + E2E) |
| **1.3.1** Info e Relacionamentos | Parcial (ARIA em QI components) | Alto (PageWrapper com landmarks) |
| **1.4.3** Contraste Minimo | Nao verificado | Verificado (audit + E2E) |
| **1.4.11** Contraste Nao-Texto | Nao | Verificado no audit |
| **2.1.1** Teclado | Parcial (QI components) | Sistematico (E2E + audit) |
| **2.4.1** Skip Links | Nao | Sim (PageWrapper.SkipLinks) |
| **2.4.3** Ordem de Foco | Parcial (useFocusTrap) | Sim (focus trap + E2E test) |
| **2.4.6** Headings/Labels | Nao verificado | E2E verifica hierarquia |
| **3.3.1** Identificacao de Erro | Parcial (QiInput error) | Sim (aria-invalid + role="alert") |
| **3.3.2** Labels/Instrucoes | Parcial | Sim (audit + lint) |
| **4.1.2** Nome, Role, Value | Parcial | Sim (audit + lint) |

### Nivel Estimado

- **raiz-platform**: WCAG 2.1 **A parcial** — componentes QI do design system sao AA-compliant mas a aplicacao como um todo nao tem verificacao sistematica
- **rAIz-AI-Prof**: WCAG 2.1 **AA parcial** — infraestrutura completa, verificacao E2E, mas com debt conhecido (contraste em sidebar cards, placeholders como labels)

---

## 5. i18n Infrastructure

### Comparacao

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Framework** | Nenhum | react-i18next v15 + i18next v24 |
| **Idiomas** | pt-BR (hardcoded) | pt-BR, en-US, es-ES |
| **Deteccao de idioma** | N/A | i18next-browser-languagedetector |
| **ESLint i18n** | N/A | eslint-plugin-i18next (OFF) |
| **Formato traducao** | N/A | JSON (locales) + *.copy.ts (domain) |
| **Tipagem** | N/A | Forte (RequiredTranslations, DomainTranslations) |
| **Formatadores** | N/A | Intl API (numero, data, moeda, plural) |
| **Persistencia** | N/A | localStorage (`raiz_language`) |
| **HTML lang** | `pt-BR` (fixo) | `pt-BR` (dinamico via i18n) |

### rAIz-AI-Prof — Arquitetura i18n

**Arquivo central**: `D:\GitHub\rAIz-AI-Prof\lib\i18n\index.ts`

Duas camadas de traducao:

**1. JSON Globais** (UI generica):
- `D:\GitHub\rAIz-AI-Prof\lib\i18n\locales\pt-BR.json` — 1322 chaves
- `D:\GitHub\rAIz-AI-Prof\lib\i18n\locales\en-US.json` — 1250 chaves
- `D:\GitHub\rAIz-AI-Prof\lib\i18n\locales\es-ES.json` — 1235 chaves
- Secoes: common, sidebar, tools, navigation, home, dashboard, specialists, questions, exam, bncc, lessonPlan, presentation, essay, games, pei, olympiads, adaptacaoProva, supportMaterials, mindmap, settings, configPage, modals, forms, errors, success, time, auth, onboarding, pwa, export, bank, stats, wizard, mobile, feedback, autoSave, chat, questionsV2, menuVisibility, **aria**, accessLevels, **accessibility**, taxonomy, questoes, socraticStudy

**2. Domain Copy Files** (`*.copy.ts`):
- 35 arquivos copy.ts em `D:\GitHub\rAIz-AI-Prof\domain\*\v0\*.copy.ts`
- Pattern: `DomainTranslations<T>` com `getDomainTranslation()` para resolver idioma atual
- Tipagem forte: `RequiredTranslations<T>` exige todos os idiomas
- Compatibilidade: `PartialTranslations<T>` para migracao gradual (apenas pt-BR obrigatorio)
- Legacy getters (ex: `LOGIN_PAGE.title`) para backwards compatibility

**Tipos**: `D:\GitHub\rAIz-AI-Prof\lib\i18n\types.ts`
- `LanguageCode`, `RequiredTranslations<T>`, `PartialTranslations<T>`, `TranslationShape<T>`, `CopyGetter<T>`, `StrictCopyFile<T>`
- Funcoes utilitarias: `hasAllLanguages()`, `getMissingLanguages()`

**Formatadores**: `D:\GitHub\rAIz-AI-Prof\lib\i18n\formatters.ts`
- `formatNumber`, `formatCurrency`, `formatPercent`, `formatCompact`
- `formatDate`, `formatDateTime`, `formatTime`
- `formatRelativeTime`, `formatRelativeTimeFromNow`
- `formatList`, `formatCount`, `getPlural`
- Todos usam `Intl` API com locale awareness

---

## 6. RTL Support

### Comparacao

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Infraestrutura** | Nenhuma | Completa |
| **Idiomas RTL** | N/A | ar, he, fa, ur (8 variantes) |
| **Hook React** | N/A | `useRTL()` |
| **CSS Utilities** | N/A | `getLogicalProperty()`, `getRTLClasses()` |
| **Tailwind RTL** | N/A | Mapeamento ltr:/rtl: completo |
| **Document dir** | N/A | `updateDocumentDirection()` |

### rAIz-AI-Prof — Detalhes RTL

Arquivo: `D:\GitHub\rAIz-AI-Prof\lib\i18n\rtl.ts`

Infraestrutura completa para suporte RTL:
- **8 idiomas RTL** definidos: ar, ar-SA, ar-EG, ar-AE, he, he-IL, fa, fa-IR, ur, ur-PK
- **Hook `useRTL()`**: Rastreia direcao, atualiza `document.dir`, escuta mudancas de idioma
- **`getLogicalProperty()`**: Converte propriedades fisicas para logicas (margin-left -> margin-inline-start)
- **`getRTLTransform()`**: Inverte translateX para RTL
- **`getRTLClasses()`**: Gera classes Tailwind com variantes ltr:/rtl: (ml-4 -> "ltr:ml-4 rtl:mr-4")

**Nota**: Apesar da infraestrutura completa, nenhum dos 3 idiomas ativos (pt-BR, en-US, es-ES) e RTL. O suporte e preparatorio para expansao futura.

---

## 7. Semantic HTML & ARIA

### Comparacao

| Padrao | raiz-platform | rAIz-AI-Prof |
|--------|--------------|--------------|
| **Skip Links** | Nao | Sim (`PageWrapper.SkipLinks`) |
| **Landmarks (main/nav/aside)** | Parcial | Sistematico (`PageWrapper`) |
| **Dialog (role="dialog")** | Sim (QiModal) | Sim (AccessibleModal) |
| **aria-modal** | Sim | Sim |
| **aria-labelledby** | Sim | Sim |
| **aria-describedby** | Parcial | Sistematico |
| **aria-live regions** | Nao sistematico | Sim (AccessibleTextarea) |
| **aria-invalid** | Parcial | Sistematico |
| **aria-required** | Nao | Sim |
| **role="alert"** | Nao sistematico | Sim (errors com role="alert") |
| **role="status"** | Nao | Sim (loading states) |
| **sr-only** | Nao sistematico | Sim (labels, headings) |

### raiz-platform — ARIA Patterns

**QI Design System** (`D:\GitHub\raiz-platform\src\components\qi\`):
- 28 componentes com ARIA basico
- QiModal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`, focus restore
- QiButton, QiInput, etc.: ARIA basico via atributos HTML nativos
- QiSidebar: ARIA props passados nos testes

**Focus Management** (`D:\GitHub\raiz-platform\src\hooks\useFocusTrap.ts`):
- Focus trap com Tab/Shift+Tab cycling
- ESC handler
- Restore focus on deactivation
- Auto-focus primeiro elemento

### rAIz-AI-Prof — ARIA Patterns

**Componentes Acessiveis** (`D:\GitHub\rAIz-AI-Prof\components\common\`):
- `AccessibleModal`: focus trap, ESC close, aria-labelledby/describedby, body scroll lock
- `AccessibleTextarea`: auto-ID, aria-describedby (hint + error + counter), aria-invalid, aria-required, aria-live counter
- `AccessibleInput`: auto-ID, aria-describedby, aria-invalid, sr-only labels
- `PageWrapper`: landmarks (main, nav, aside, header, footer), skip links, document title update
- `SectionWrapper`: role awareness (navigation, complementary, search, form, region)
- `ActionBar`: navegacao de acoes com aria-label

**Focus Management** (`D:\GitHub\rAIz-AI-Prof\components\common\useFocusTrap.ts`):
- Focus trap com Tab/Shift+Tab
- Auto-focus, restore focus, body scroll prevention
- Tipagem generica com RefObject

**Traducoes de A11y no JSON**:
- Secao `aria` com 25 chaves traduzidas
- Secao `accessibility` com 40 chaves traduzidas

---

## 8. Focus Management

### Comparacao

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Focus Trap Hook** | `useFocusTrap` | `useFocusTrap` |
| **Tab cycling** | Sim | Sim |
| **Shift+Tab** | Sim | Sim |
| **ESC handler** | Sim (no hook) | Sim (no modal) |
| **Restore focus** | Sim | Sim |
| **Auto-focus** | Sim | Sim |
| **Body scroll lock** | Sim (no modal) | Sim (no hook) |
| **focus-visible CSS** | Sim (QI components) | Sim (componentes comuns) |
| **E2E test keyboard** | Nao | Sim (20 tab stops verificados) |

Ambos projetos implementam focus trap de forma similar e competente. A principal diferenca e que rAIz-AI-Prof **testa** a navegacao por teclado em E2E.

---

## 9. Color Contrast & Dark Mode

### Comparacao

| Aspecto | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| **Dark Mode** | Sim (ThemeProvider) | Sim (useTheme + Tailwind) |
| **Modos** | light/dark/system | light/dark/system |
| **CSS Variables** | QI tokens (--qi-*) | Theme tokens (text-theme-*) |
| **Verificacao contraste** | Nao automatizada | Audit estatico + E2E |
| **Debt conhecido** | Nao documentado | Sim (sidebar cards excluidos) |
| **Design tokens** | design-tokens.ts, color-scheme.ts | design-tokens.ts, color-scheme.ts |

### raiz-platform — Dark Mode

Arquivo: `D:\GitHub\raiz-platform\src\context\ThemeContext.tsx`
- ThemeProvider com 3 modos (light/dark/system)
- Persiste em localStorage (`qi-theme`)
- Aplica classe `dark` no `<html>`
- Escuta `prefers-color-scheme` para modo system
- CSS variables do design system QI (`--qi-surface`, `--qi-text-primary`, etc.)

### rAIz-AI-Prof — Dark Mode

- Tailwind dark: variant
- Design tokens com variantes dark (`dark:bg-slate-800`, `dark:text-slate-100`)
- Color scheme por modulo (`D:\GitHub\rAIz-AI-Prof\config\color-scheme.ts`)
- Cores com variantes dark explicitas para todos os esquemas
- **Verificacao de contraste** no audit estatico e nos testes E2E
- Debt documentado: contraste em `.line-clamp-2.text-xs` (sidebar cards)

---

## 10. Translation Coverage

### rAIz-AI-Prof — Cobertura

| Idioma | Chaves | Cobertura (vs pt-BR) | Chaves Faltantes |
|--------|--------|---------------------|-----------------|
| pt-BR | 1322 | 100% (base) | 0 |
| en-US | 1250 | 94.6% | 72 |
| es-ES | 1235 | 93.4% | 107 (87 exclusivas) |

**Principais gaps em en-US** (72 chaves faltantes):
- Modulo OMR/leitura optica completo (sidebar.omrReading, questoes.omr.*)
- sidebar.students, sidebar.bnccDuo, sidebar.socraticStudy, sidebar.mathroots
- Secoes novas adicionadas apos a migracao inicial

**Principais gaps em es-ES** (107 chaves faltantes):
- Todos os gaps de en-US mais ~35 chaves adicionais
- Tendencia: modulos novos sao adicionados em pt-BR e en-US primeiro, es-ES fica para tras

### Adocao do i18n nos Componentes

| Metrica | Valor |
|---------|-------|
| Arquivos .tsx totais | ~1260 |
| Arquivos usando `useTranslation()` | 59 |
| Taxa de adocao | ~4.7% |
| Arquivos *.copy.ts (domain layer) | 35 |
| Regra ESLint `i18next/no-literal-string` | **OFF** |

A infraestrutura i18n e robusta mas a **adocao e baixa** (~4.7% dos componentes). A maioria dos componentes ainda usa strings hardcoded em portugues. A regra ESLint que detectaria isso esta desabilitada (comentario: "no i18n plan").

### raiz-platform — Cobertura i18n

**Zero**. Nenhuma infraestrutura de i18n. HTML fixo em `lang="pt-BR"`. Todos os textos sao strings literais em portugues no codigo-fonte.

---

## 11. Translation Workflow

### rAIz-AI-Prof

**Ferramentas de workflow**:
1. **Scripts de validacao** (`D:\GitHub\rAIz-AI-Prof\scripts\i18n-validate.js`): Verifica chaves faltantes entre locales
2. **Scripts de migracao** (`D:\GitHub\rAIz-AI-Prof\scripts\i18n-migration.js`): Auxilia migracao de strings hardcoded
3. **Scripts de auditoria** (`D:\GitHub\rAIz-AI-Prof\scripts\i18n-audit.js`): Gera relatorios de cobertura

**Relatorios existentes**:
- `D:\GitHub\rAIz-AI-Prof\i18n-validation-report.json` — Status por locale
- `D:\GitHub\rAIz-AI-Prof\i18n-audit-report.json` — Auditoria completa
- `D:\GitHub\rAIz-AI-Prof\i18n-migration-report.json` — Progresso de migracao

**Dual-layer pattern**:
1. **JSON centralizados** para UI generica — hook `useTranslation()` do react-i18next
2. **Copy files** (*.copy.ts) para domain layer — funcao `getDomainTranslation()` sem dependencia React

**Tipagem**:
- `RequiredTranslations<T>`: exige todos os 3 idiomas (para codigo novo)
- `PartialTranslations<T>`: apenas pt-BR obrigatorio (para migracao gradual)
- `hasAllLanguages()` e `getMissingLanguages()`: validacao em runtime

---

## 12. Tabela Comparativa Consolidada

| Dimensao | raiz-platform | rAIz-AI-Prof | Gap |
|----------|--------------|--------------|-----|
| jsx-a11y lint | 6 regras (via Next.js) | 22 regras explicitas | **Alto** |
| A11y unit tests | 1 arquivo (12 componentes QI) | 1 arquivo (mocks manuais) | Medio |
| A11y E2E tests | 0 | 7 testes (axe-core + playwright) | **Alto** |
| pa11y | 0 | Sim (script + config) | **Alto** |
| Storybook a11y | 0 | Sim (@storybook/addon-a11y) | Medio |
| Audit script | 0 | Sim (WCAG mapped) | **Alto** |
| Skip links | 0 | Sim (3 skip links) | **Alto** |
| ARIA landmarks | Parcial | Sistematico (PageWrapper) | Medio |
| Focus trap | Sim (hook) | Sim (hook) | Nenhum |
| Accessible components | QI design system | AccessibleModal/Textarea/Input | Baixo |
| Dark mode a11y | Sem verificacao | Verificado (E2E) | Medio |
| i18n framework | Nenhum | react-i18next completo | **Critico** |
| Idiomas | 1 (pt-BR hardcoded) | 3 (pt-BR, en-US, es-ES) | **Critico** |
| RTL support | Nenhum | Infraestrutura completa | Alto |
| Translation coverage | N/A | 93-95% | N/A |
| Translation types | N/A | RequiredTranslations<T> | N/A |
| i18n lint rule | N/A | Existe mas OFF | Medio |
| Formatadores Intl | N/A | Completo (12 funcoes) | N/A |
| i18n component adoption | N/A | 4.7% (59/1260 componentes) | N/A |

---

## 13. Gaps Identificados

### Gaps raiz-platform

| ID | Gap | Severidade |
|----|-----|-----------|
| G1 | Nenhuma infraestrutura i18n | Critico |
| G2 | Apenas 6 regras jsx-a11y (minimo do Next.js) | Alto |
| G3 | Zero testes E2E de acessibilidade | Alto |
| G4 | Sem skip links para navegacao por teclado | Alto |
| G5 | Sem script de auditoria a11y | Alto |
| G6 | Sem verificacao automatizada de contraste | Alto |
| G7 | Sem pa11y para scan dinamico | Medio |
| G8 | Sem Storybook addon a11y | Medio |
| G9 | ARIA landmarks nao sistematicos | Medio |
| G10 | Sem aria-live regions para estados dinamicos | Medio |
| G11 | QI Modal usa ID fixo (`qi-modal-title`) — colisao se 2 modais | Baixo |

### Gaps rAIz-AI-Prof

| ID | Gap | Severidade |
|----|-----|-----------|
| G12 | Regra `i18next/no-literal-string` desabilitada | Alto |
| G13 | Apenas 4.7% dos componentes usam useTranslation() | Alto |
| G14 | 72 chaves faltando em en-US, 107 em es-ES | Medio |
| G15 | Testes unitarios a11y usam mocks manuais (nao axe-core real) | Medio |
| G16 | Contraste debt em sidebar cards nao resolvido | Medio |
| G17 | label-has-associated-control desabilitada (Radix UI) | Baixo |
| G18 | RTL testado unitariamente mas nenhum idioma RTL ativo | Informativo |

---

## 14. Oportunidades Priorizadas

### P0 — Criticos (Bloqueadores de Qualidade)

| # | Oportunidade | Projeto | Esforco | Impacto |
|---|-------------|---------|---------|---------|
| 1 | **Adicionar jsx-a11y explicito ao raiz-platform** com as 22 regras do rAIz-AI-Prof | raiz-platform | S (2h) | Alto |
| 2 | **Criar testes E2E de a11y no raiz-platform** usando o padrao do rAIz-AI-Prof (axe-core/playwright) | raiz-platform | M (4-6h) | Alto |
| 3 | **Ativar `i18next/no-literal-string` como warn** no rAIz-AI-Prof para tracking gradual | rAIz-AI-Prof | S (1h) | Alto |

### P1 — Importantes (Melhoria Significativa)

| # | Oportunidade | Projeto | Esforco | Impacto |
|---|-------------|---------|---------|---------|
| 4 | **Implementar skip links** no raiz-platform (copiar `PageWrapper.SkipLinks` do rAIz-AI-Prof) | raiz-platform | S (2h) | Alto |
| 5 | **Criar audit script a11y** para raiz-platform (adaptar `scripts/a11y-audit.js` do rAIz-AI-Prof) | raiz-platform | M (4h) | Alto |
| 6 | **Completar traducoes faltantes** en-US (72 chaves) e es-ES (107 chaves) no rAIz-AI-Prof | rAIz-AI-Prof | M (4h) | Medio |
| 7 | **Sistematizar ARIA landmarks** no raiz-platform com pattern PageWrapper/SectionWrapper | raiz-platform | M (6h) | Medio |
| 8 | **Migrar mais componentes para useTranslation()** no rAIz-AI-Prof — priorizar componentes do dashboard | rAIz-AI-Prof | L (12h+) | Medio |
| 9 | **Adicionar pa11y ao raiz-platform** para scans dinamicos no CI | raiz-platform | S (2h) | Medio |

### P2 — Desejavel (Maturidade)

| # | Oportunidade | Projeto | Esforco | Impacto |
|---|-------------|---------|---------|---------|
| 10 | **Adicionar @storybook/addon-a11y** ao raiz-platform se/quando Storybook for adotado | raiz-platform | S (1h) | Baixo |
| 11 | **Corrigir QiModal ID fixo** — usar `useId()` como o AccessibleModal faz | raiz-platform | S (1h) | Baixo |
| 12 | **Adicionar aria-live regions** para toast/notification system no raiz-platform | raiz-platform | M (4h) | Medio |
| 13 | **Substituir testes a11y manuais** por axe-core real nos unit tests do rAIz-AI-Prof | rAIz-AI-Prof | M (4h) | Medio |
| 14 | **Verificacao de contraste em dark mode** no raiz-platform (adaptar o E2E test do rAIz-AI-Prof) | raiz-platform | S (2h) | Medio |

### P3 — Futuro (Expansao)

| # | Oportunidade | Projeto | Esforco | Impacto |
|---|-------------|---------|---------|---------|
| 15 | **Avaliar i18n para raiz-platform** — se necessidade de internacionalizacao surgir | raiz-platform | XL | Depende |
| 16 | **Ativar idioma RTL** no rAIz-AI-Prof quando houver demanda (ar-SA) | rAIz-AI-Prof | L (12h) | Depende |
| 17 | **CI gate de a11y** — bloquear PRs com violacoes criticas em ambos projetos | Ambos | M (6h) | Alto |
| 18 | **Shared a11y testing library** — extrair patterns comuns para pacote compartilhado | Ambos | L (12h) | Medio |

---

## 15. Patterns Reutilizaveis

### Do rAIz-AI-Prof para raiz-platform

| Pattern | Origem | Destino Sugerido |
|---------|--------|-----------------|
| `PageWrapper` + `SkipLinks` | `rAIz-AI-Prof/components/common/PageWrapper.tsx` | `raiz-platform/src/components/qi/QiPageWrapper.tsx` |
| `SectionWrapper` | `rAIz-AI-Prof/components/common/PageWrapper.tsx` | `raiz-platform/src/components/qi/QiSection.tsx` |
| `AccessibleTextarea` | `rAIz-AI-Prof/components/common/AccessibleTextarea.tsx` | Incorporar pattern em `QiTextarea` |
| `AccessibleInput` | `rAIz-AI-Prof/components/common/AccessibleInput.tsx` | Incorporar pattern em `QiInput` |
| E2E a11y tests | `rAIz-AI-Prof/test/e2e/accessibility.e2e.test.ts` | Adaptar para Playwright do raiz-platform |
| a11y-audit.js | `rAIz-AI-Prof/scripts/a11y-audit.js` | Copiar e adaptar caminhos |
| ESLint jsx-a11y config | `rAIz-AI-Prof/eslint.config.mjs` (linhas 104-127) | Adicionar ao `.eslintrc.json` |

### Do raiz-platform para rAIz-AI-Prof

| Pattern | Origem | Destino Sugerido |
|---------|--------|-----------------|
| QI Design System axe-core tests | `raiz-platform/src/components/qi/__tests__/accessibility.test.tsx` | Adaptar para Vitest no rAIz-AI-Prof |
| DataProductCard keyboard pattern | `raiz-platform/src/components/totvs-sql/DataProductCard.tsx` | Pattern para cards clicaveis |

---

## 16. Recomendacoes Concretas

### Para raiz-platform (Top 5)

1. **ESLint**: Adicionar ao `.eslintrc.json`:
   ```json
   "plugins": ["@typescript-eslint", "raiz", "jsx-a11y"],
   "rules": {
     "jsx-a11y/click-events-have-key-events": "warn",
     "jsx-a11y/no-static-element-interactions": "warn",
     "jsx-a11y/interactive-supports-focus": "warn",
     "jsx-a11y/heading-has-content": "warn",
     "jsx-a11y/no-noninteractive-element-interactions": "warn",
     "jsx-a11y/no-noninteractive-tabindex": "warn",
     "jsx-a11y/tabindex-no-positive": "warn",
     "jsx-a11y/no-redundant-roles": "warn",
     "jsx-a11y/no-autofocus": ["warn", { "ignoreNonDOM": true }],
     "jsx-a11y/html-has-lang": "warn",
     "jsx-a11y/img-redundant-alt": "warn",
     "jsx-a11y/anchor-has-content": "warn",
     "jsx-a11y/anchor-is-valid": "warn"
   }
   ```

2. **Skip Links**: Criar `QiSkipLinks` baseado no `PageWrapper.SkipLinks` de rAIz-AI-Prof e incluir no layout principal (`src/app/layout.tsx`)

3. **E2E Tests**: Criar `tests/e2e/accessibility.spec.ts` usando `@axe-core/playwright` com:
   - Scan wcag2aa na home autenticada
   - Verificacao de heading hierarchy
   - Verificacao de labels em formularios
   - Verificacao de navegacao por teclado

4. **QiModal Fix**: Substituir IDs fixos (`qi-modal-title`) por `useId()` para evitar colisao com multiplos modais

5. **aria-live**: Adicionar `role="alert"` e `aria-live="assertive"` ao `QiToast` e `QiAlert`

### Para rAIz-AI-Prof (Top 5)

1. **ESLint**: Mudar `i18next/no-literal-string` de `off` para `warn` para comecar a rastrear strings hardcoded

2. **Traducoes**: Completar as 72 chaves faltantes em en-US e 107 em es-ES (priorizar modulo OMR e sidebar)

3. **axe-core nos unit tests**: Substituir mocks manuais em `test/a11y.test.tsx` por `vitest-axe` com componentes reais

4. **Adocao i18n**: Criar sprint dedicado para migrar os componentes mais usados (dashboard, sidebar, navigation) para `useTranslation()` — meta: subir de 4.7% para 20%

5. **Contraste debt**: Resolver contraste insuficiente em `.line-clamp-2.text-xs` (sidebar cards) que esta excluido dos testes E2E

---

## 17. Conclusao

O **rAIz-AI-Prof** possui infraestrutura superior em acessibilidade e internacionalizacao, com:
- Linting a11y 4x mais abrangente
- Testes E2E de acessibilidade maduros
- Sistema i18n completo com tipagem forte
- Suporte RTL preparatorio
- Componentes acessiveis dedicados
- Scripts de auditoria e validacao

O **raiz-platform** tem uma base solida no design system QI (28 componentes com ARIA e testes axe-core) mas carece de verificacao sistematica e nao tem infraestrutura de i18n.

**Prioridade imediata**: Transferir os patterns de linting (22 regras jsx-a11y), testes E2E (axe-core/playwright), e skip links do rAIz-AI-Prof para o raiz-platform. Estas sao melhorias de baixo esforco e alto impacto.

**Prioridade media**: Aumentar adocao de i18n no rAIz-AI-Prof (de 4.7% para 20%+) e completar traducoes faltantes.

**Decisao futura**: Avaliar necessidade de i18n no raiz-platform apenas se surgir demanda real de internacionalizacao (atualmente serve exclusivamente o mercado brasileiro).
