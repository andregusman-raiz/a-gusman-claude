# DOC-7 — Design System Tokens & Component Specs

**Projeto**: TOTVS Educacional — Frontend
**Design Language**: Swiss Modernism 2.0
**Versão**: 1.0.0
**Última atualização**: 2026-03-20
**Status**: Referência executável

---

## Sumário

1. [Filosofia de Design](#1-filosofia-de-design)
2. [Tokens de Cor](#2-tokens-de-cor-css-custom-properties)
3. [Tipografia — IBM Plex Sans](#3-tipografia--ibm-plex-sans)
4. [Sistema de Espaçamento](#4-sistema-de-espaçamento)
5. [Layout Shell](#5-layout-shell)
6. [Especificações de Componentes](#6-especificações-de-componentes)
7. [Configuração Tailwind](#7-configuração-tailwind)
8. [Checklist de Acessibilidade (WCAG AA)](#8-checklist-de-acessibilidade-wcag-aa)
9. [Anti-patterns — Proibido](#9-anti-patterns--proibido)
10. [Mapeamento shadcn/ui](#10-mapeamento-shadcnui)

---

## 1. Filosofia de Design

### Swiss Modernism 2.0

O sistema visual do TOTVS Educacional segue a filosofia **Swiss Modernism 2.0** — design funcional derivado da escola suíça dos anos 1950–70, adaptado para software de gestão educacional de uso intensivo (6–8h diárias).

| Princípio | Definição | Aplicação prática |
|-----------|-----------|-------------------|
| **Densidade máxima sem sacrificar legibilidade** | Cada pixel deve transportar informação útil | Tabelas compactas, espaçamento econômico, sem decoração vazia |
| **Hierarquia visual rígida** | O usuário sempre sabe onde está e o que fazer a seguir | Topbar fixa, breadcrumb, título de página sempre visível |
| **Zero ornamentação** | Nenhum elemento visual sem função | Proibido: glassmorphism, gradientes, sombras decorativas, animações sem propósito |
| **Sinais de confiança** | Interface sólida, madura, previsível | Bordas nítidas, cores consistentes, estados explícitos (loading, error, success) |
| **Light mode por padrão** | ERP: usuários preferem claro para jornadas de 8h — menor fadiga ocular | Background neutro `#F4F6F7`, superfícies brancas, texto escuro de alto contraste |

### Rejeições explícitas

- **Glassmorphism** — blur + transparência = sobrecarga visual em tabelas densas
- **Gradientes decorativos** — aceitável apenas em gráficos de dados (não em UI)
- **Dark mode como default** — pesquisas com ERPs mostram preferência por claro em uso prolongado; dark mode pode ser oferecido como opção futura
- **Micro-animações desnecessárias** — transições apenas quando transmitem estado (loading, modal open)
- **Cards com sombra excessiva** — usar borda sutil ao invés de box-shadow elevada

---

## 2. Tokens de Cor (CSS Custom Properties)

### Definição completa

```css
:root {
  /* ─── Paleta Principal ─── */
  --color-primary:        #1B4F72;  /* Azul TOTVS — ações primárias, links, botões */
  --color-primary-hover:  #154360;  /* Hover do primário — 10% mais escuro */
  --color-secondary:      #2E86AB;  /* Azul médio — foco, bordas ativas, accents */
  --color-accent:         #E67E22;  /* Laranja — alertas não-críticos, destaques */

  /* ─── Semântica de Estado ─── */
  --color-success:        #1E8449;  /* Verde — confirmação, status ativo */
  --color-warning:        #D4AC0D;  /* Amarelo — atenção, pendente */
  --color-danger:         #C0392B;  /* Vermelho — erro, exclusão, crítico */

  /* ─── Fundos e Superfícies ─── */
  --color-bg:             #F4F6F7;  /* Fundo da página (cinza neutro levíssimo) */
  --color-surface:        #FFFFFF;  /* Superfície de cards, modais, painéis */
  --color-border:         #D5D8DC;  /* Bordas, separadores */

  /* ─── Texto ─── */
  --color-text-primary:   #1A1A2E;  /* Texto principal — títulos, labels, dados */
  --color-text-secondary: #566573;  /* Texto secundário — sublabels, metadados */
  --color-text-muted:     #808B96;  /* Texto mudo — placeholders, desabilitados */

  /* ─── Estados de Interação ─── */
  --color-bg-hover:       #EBF5FB;  /* Hover em linhas de tabela, itens de lista */
  --color-bg-selected:    #D6EAF8;  /* Selecionado (tabela, sidebar) */
  --color-bg-stripe:      #F8F9FA;  /* Zebragem par de tabelas */

  /* ─── Focus ─── */
  --color-focus-ring:     rgba(46, 134, 171, 0.25); /* Focus ring de inputs */
}
```

### Razões de contraste (WCAG AA — mínimo 4.5:1 para texto normal)

| Par de cores | Razão | Status |
|---|---|---|
| `text-primary` (#1A1A2E) sobre `bg` (#F4F6F7) | **13.7:1** | ✅ AAA |
| `text-primary` (#1A1A2E) sobre `surface` (#FFFFFF) | **16.0:1** | ✅ AAA |
| `text-secondary` (#566573) sobre `surface` (#FFFFFF) | **5.3:1** | ✅ AA |
| `text-muted` (#808B96) sobre `surface` (#FFFFFF) | **3.9:1** | ⚠️ Apenas texto grande (18px+) |
| `primary` (#1B4F72) sobre `surface` (#FFFFFF) | **8.1:1** | ✅ AAA |
| `secondary` (#2E86AB) sobre `surface` (#FFFFFF) | **4.7:1** | ✅ AA |
| `accent` (#E67E22) sobre `surface` (#FFFFFF) | **3.6:1** | ⚠️ Apenas texto grande (18px+) |
| `success` (#1E8449) sobre `surface` (#FFFFFF) | **5.8:1** | ✅ AA |
| `danger` (#C0392B) sobre `surface` (#FFFFFF) | **5.2:1** | ✅ AA |
| `warning` (#D4AC0D) sobre `surface` (#FFFFFF) | **2.9:1** | ❌ Nunca usar como texto — apenas como ícone+texto |

> **Regra**: `accent` e `warning` nunca devem ser usados como cor de texto isolada. Sempre acompanhar com texto em `text-primary` ou `text-secondary`.

### Tokens de estado de componente

```css
:root {
  /* Botão primário */
  --btn-primary-bg:         var(--color-primary);
  --btn-primary-bg-hover:   var(--color-primary-hover);
  --btn-primary-text:       #FFFFFF;

  /* Input */
  --input-border:           var(--color-border);
  --input-border-focus:     var(--color-secondary);
  --input-border-error:     var(--color-danger);
  --input-bg:               var(--color-surface);
  --input-bg-disabled:      #F2F3F4;

  /* Badge de status */
  --badge-success-bg:       #D5F5E3;
  --badge-success-text:     #1E8449;
  --badge-warning-bg:       #FEF9E7;
  --badge-warning-text:     #9A7D0A;
  --badge-danger-bg:        #FDEDEC;
  --badge-danger-text:      #C0392B;
  --badge-neutral-bg:       #F2F3F4;
  --badge-neutral-text:     #566573;
}
```

---

## 3. Tipografia — IBM Plex Sans

### Instalação

**Opção A — npm (recomendado para Next.js com App Router):**

```bash
npm install @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono
```

```ts
// app/layout.tsx
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/ibm-plex-mono/400.css';
```

**Opção B — next/font (otimizado, sem FOUT):**

```ts
// app/layout.tsx
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
  display: 'swap',
});
```

### Escala tipográfica

| Token | Tamanho | Peso | Line Height | Uso |
|-------|---------|------|-------------|-----|
| `text-caption` | 12px | 400 | 1.5 | Legendas, notas de rodapé, metadados |
| `text-body` | 14px | 400 | 1.5 | Texto de corpo, conteúdo de tabela, labels de form |
| `text-label` | 14px | 500 | 1.5 | Labels de campo, rótulos de colunas de tabela |
| `text-section` | 18px | 600 | 1.3 | Títulos de seção dentro de página |
| `text-page` | 24px | 600 | 1.3 | Título principal da página (h1) |
| `text-kpi` | 28px | 700 | 1.2 | Números de KPI em cards de dashboard |

```css
/* Tokens CSS de tipografia */
:root {
  --font-caption:    400 12px/1.5 var(--font-sans, 'IBM Plex Sans', system-ui, sans-serif);
  --font-body:       400 14px/1.5 var(--font-sans, 'IBM Plex Sans', system-ui, sans-serif);
  --font-label:      500 14px/1.5 var(--font-sans, 'IBM Plex Sans', system-ui, sans-serif);
  --font-section:    600 18px/1.3 var(--font-sans, 'IBM Plex Sans', system-ui, sans-serif);
  --font-page:       600 24px/1.3 var(--font-sans, 'IBM Plex Sans', system-ui, sans-serif);
  --font-kpi:        700 28px/1.2 var(--font-sans, 'IBM Plex Sans', system-ui, sans-serif);
  --font-mono:       400 13px/1.5 var(--font-mono, 'IBM Plex Mono', monospace);
}
```

### Regras de uso de monospace

**IBM Plex Mono obrigatório para:**
- Números de RA (Registro Acadêmico)
- Datas em colunas de tabela
- Códigos de turma, curso, disciplina
- Notas e médias em colunas numéricas
- CPF, RG, código de matrícula

```css
/* Aplicar em todas as células numéricas de tabela */
.numeric-cell,
.ra-number,
.date-cell,
.grade-cell {
  font-family: var(--font-mono, 'IBM Plex Mono', monospace);
  font-variant-numeric: tabular-nums;
  text-align: right;
}
```

> **Regra crítica**: `font-variant-numeric: tabular-nums` DEVE ser aplicado em **toda coluna numérica** de tabela. Sem isso, os números "pulam" ao scrollar, tornando comparação visual impossível.

---

## 4. Sistema de Espaçamento

### Grid base: 4px

```css
:root {
  --space-xxs:  4px;   /* Espaços internos mínimos (icon + text gap) */
  --space-xs:   8px;   /* Padding interno de badge, gap de ícones */
  --space-sm:   12px;  /* Padding de células de tabela (vertical) */
  --space-md:   16px;  /* Padding de card, gap entre campos de form */
  --space-lg:   24px;  /* Padding de página, gap entre seções */
  --space-xl:   32px;  /* Gap entre blocos maiores */
  --space-2xl:  48px;  /* Separação de seções principais */
  --space-3xl:  64px;  /* Seções de página de landing/onboarding */
}
```

### Aplicações canônicas

| Contexto | Valor | Token |
|----------|-------|-------|
| Padding de página | 24px | `--space-lg` |
| Padding de card | 16px | `--space-md` |
| Padding de célula de tabela | 8px 12px (vert/horiz) | `--space-xs` `--space-sm` |
| Gap entre campos de formulário | 16px | `--space-md` |
| Gap entre seções de formulário | 24px | `--space-lg` |
| Gap interno de botão (icon + text) | 8px | `--space-xs` |
| Margin bottom de label para input | 4px | `--space-xxs` |
| Gap entre KPI cards | 16px | `--space-md` |

### Grid de layout

```css
.page-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 var(--space-lg);
}
```

| Colunas | Uso |
|---------|-----|
| 12 | Full-width (tabelas, formulários de cadastro) |
| 8 + 4 | Conteúdo principal + painel lateral |
| 6 + 6 | Dois formulários side-by-side |
| 3 × 4 | Três blocos de KPI |
| 4 × 3 | Quatro KPI cards (padrão dashboard) |

---

## 5. Layout Shell

### Visão geral estrutural

```
┌────────────────────────────────────────────────────────────────┐
│  TOPBAR (48px fixo, z-50)                                      │
│  [Logo] [School Selector] [Module Name]    [Bell] [Avatar ▼]  │
├────────────────────────────────────────────────────────────────┤
│  BREADCRUMB BAR (40px)                                         │
│  Home > Secretaria > Alunos > Matrícula                       │
├──────────────┬─────────────────────────────────────────────────┤
│              │  PAGE CONTENT                                   │
│  SIDEBAR     │  max-width: 1440px, padding: 24px              │
│  240px /     │                                                 │
│  64px /      │  [Page Title]                                  │
│  drawer      │  [Content Area]                                │
│              │                                                 │
│  Secretaria  │                                                 │
│  Pedagógico  │                                                 │
│  Relatórios  │                                                 │
│  Config.     │                                                 │
└──────────────┴─────────────────────────────────────────────────┘
```

### Topbar

| Propriedade | Valor |
|-------------|-------|
| Altura | 48px |
| Posição | `position: fixed; top: 0; left: 0; right: 0` |
| z-index | 50 |
| Background | `var(--color-surface)` (#FFFFFF) |
| Borda inferior | `1px solid var(--color-border)` |
| Padding horizontal | 16px |

**Slots do Topbar (da esquerda para direita):**

1. **Logo** — esquerda, 32px de altura, link para `/dashboard`
2. **School Selector** — `<select>` ou `<DropdownMenu>`, exibe unidade ativa, `max-width: 240px`
3. **Module Name** — texto `text-label` com nome do módulo ativo (ex: "Secretaria Acadêmica")
4. **Spacer** — `flex: 1`
5. **Notifications Bell** — ícone Heroicons `BellIcon` 20px, badge contador, `aria-label="Notificações (N não lidas)"`
6. **User Avatar + Dropdown** — avatar 32px, nome truncado, seta, dropdown: Perfil / Configurações / Sair

### Sidebar

| Estado | Largura | Conteúdo |
|--------|---------|----------|
| Expandida (`>=1280px`) | 240px | Ícone 20px + Label de texto |
| Colapsada (`768–1279px`) | 64px | Apenas ícone 20px (tooltip no hover) |
| Mobile (`<768px`) | 0 (drawer overlay) | Drawer de 280px via `<Sheet>` do shadcn |

**Seções da sidebar:**

```
─ Secretaria
  • Alunos
  • Matrículas
  • Turmas
  • Documentos

─ Pedagógico
  • Diário de Classe
  • Notas e Frequência
  • Conteúdo Programático
  • Ocorrências

─ Relatórios
  • Relatórios Acadêmicos
  • Exportações
  • BI / Dashboard

─ Configurações
  • Parâmetros do Sistema
  • Usuários e Permissões
  • Integrações TOTVS
```

**Estados de item de sidebar:**

```css
/* Item normal */
.sidebar-item {
  height: 40px;
  padding: 0 12px;
  border-radius: 6px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 10px;
  font: var(--font-label);
  cursor: pointer;
}

/* Hover */
.sidebar-item:hover {
  background: #F2F3F4;
  color: var(--color-text-primary);
}

/* Ativo */
.sidebar-item[aria-current="page"] {
  background: var(--color-primary);
  color: #FFFFFF;
}
```

**Ícones:** Heroicons outline, 20px. Sempre `aria-hidden="true"` (texto é o label acessível).

### Breadcrumb Bar

| Propriedade | Valor |
|-------------|-------|
| Altura | 40px |
| Posição | Abaixo do topbar (não sticky) |
| Background | `var(--color-bg)` |
| Borda inferior | `1px solid var(--color-border)` |
| Separador | `/` em `text-muted` |
| Links | Clicáveis (todos — anti-pattern: breadcrumb não-clicável) |
| Último item | Não-clicável, `font-weight: 500`, `color: text-primary` |

### Breakpoints e comportamento responsivo

| Breakpoint | Sidebar | Layout | Notas |
|-----------|---------|--------|-------|
| `>= 1280px` | 240px expandida | Grade 12 col | Padrão para usuários de ERP (desktop) |
| `768px – 1279px` | 64px colapsada (ícones + tooltip) | Grade 12 col | Tablets e monitores pequenos |
| `< 768px` | 0 + drawer via hamburger | Stack vertical | Mobile/tablet portrait |

```css
/* Offset do conteúdo para compensar sidebar + topbar */
.main-content {
  margin-top: 48px;   /* topbar */
  padding-top: 40px;  /* breadcrumb */
}

@media (min-width: 1280px) {
  .main-content { margin-left: 240px; }
}

@media (min-width: 768px) and (max-width: 1279px) {
  .main-content { margin-left: 64px; }
}

@media (max-width: 767px) {
  .main-content { margin-left: 0; }
}
```

---

## 6. Especificações de Componentes

### 6.1 DataTable (componente mais crítico)

O DataTable é o componente central do sistema. A maioria das telas de ERP é baseada em listagem + ação. Especificação completa:

#### Anatomia

```
┌─────────────────────────────────────────────────────────────────┐
│ TABLE HEADER                                    [Compact ⟺]    │
├──┬──────────────────┬────────────┬──────────┬───────────────────┤
│☐ │ NOME ↑           │ RA         │ TURMA    │ STATUS            │
├──┼──────────────────┼────────────┼──────────┼───────────────────┤
│☐ │ João da Silva    │ 2024001234 │ 3ºA-INF  │ ● Ativo           │  (branco)
├──┼──────────────────┼────────────┼──────────┼───────────────────┤
│☐ │ Maria Oliveira   │ 2024001235 │ 3ºA-INF  │ ● Ativo           │  (#F8F9FA)
├──┴──────────────────┴────────────┴──────────┴───────────────────┤
│ BULK ACTIONS BAR (visível quando N itens selecionados)          │
├─────────────────────────────────────────────────────────────────┤
│ Exibindo 1–50 de 234    [<< < 1 2 3 4 5 > >>]   [50/pág ▼]   │
└─────────────────────────────────────────────────────────────────┘
```

#### Especificação de propriedades

| Propriedade | Valor padrão | Modo compacto | Notas |
|-------------|-------------|---------------|-------|
| Altura de linha | 40px | 32px | Toggle via botão no header |
| Zebragem | Linhas pares: `#F8F9FA` | Idem | Linhas ímpares: branco |
| Header sticky | Sim (scroll > 400px) | Idem | `position: sticky; top: 0` |
| Padding de célula | 8px 12px | 6px 12px | Vertical / Horizontal |
| Colunas numéricas | Alinhamento: direita | Idem | + `tabular-nums` + monospace |
| Formato de data | DD/MM/YYYY | Idem | Sempre — sem exceções |

#### Comportamentos

| Comportamento | Especificação |
|---|---|
| **Seleção** | Checkbox na primeira coluna; "Selecionar tudo" no header seleciona página atual |
| **Bulk Actions** | Barra desliza para baixo ao selecionar ≥1 item: conta selecionados + ações contextuais |
| **Ordenação** | Click em header de coluna: ASC → DESC → sem ordenação; ícone seta exibe estado |
| **Paginação** | Server-side; máx 50 por página; botões: Primeira / Anterior / 1-5 / Próxima / Última |
| **Estado vazio** | Ilustração + mensagem descritiva + botão CTA ("Cadastrar primeiro aluno") |
| **Loading** | 3–5 linhas skeleton com animação `pulse`; altura igual a linhas reais |
| **Status** | SEMPRE ícone + texto + cor (nunca cor sozinha) |
| **Hover** | Linha inteira: `background: var(--color-bg-hover)` |

#### Status na tabela — padrão obrigatório

```tsx
// Nunca usar apenas cor
// ❌ <span className="text-green-600">●</span>

// ✅ Sempre: ícone + texto + cor
<Badge variant="success">
  <CheckCircleIcon className="w-3 h-3" aria-hidden="true" />
  Ativo
</Badge>
```

#### Paginação

```
[<< Primeira]  [< Anterior]  [1] [2] [3] [4] [5]  [Próxima >]  [Última >>]

Exibindo 1–50 de 234 registros     [Itens por página: 50 ▼]
```

### 6.2 Campos de Formulário

#### Anatomia de campo padrão

```
[Label *]         ← sempre acima, nunca como placeholder
[________________]  ← input 40px altura
[Mensagem de erro]  ← abaixo, vermelho, role="alert"
```

#### Especificações

| Propriedade | Valor |
|-------------|-------|
| Posição do label | Sempre acima do campo (nunca placeholder-as-label) |
| Altura do input | 40px |
| Altura do select | 40px |
| Altura mínima do textarea | 80px; redimensionável verticalmente |
| Borda padrão | `1px solid var(--color-border)` |
| Borda em foco | `1px solid var(--color-secondary)` |
| Borda em erro | `1px solid var(--color-danger)` |
| Focus ring | `box-shadow: 0 0 0 3px var(--color-focus-ring)` |
| Campo obrigatório | `*` vermelho + texto `.sr-only` "(obrigatório)" |
| Estado de submissão | Botão desabilitado + spinner durante async |
| Atalho de teclado | `Ctrl+S` salva o formulário |

#### CSS de focus ring

```css
.input-field:focus {
  outline: none;
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}

.input-field.error {
  border-color: var(--color-danger);
}

.input-field.error:focus {
  box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.2);
}
```

#### Mensagem de erro

```tsx
// Estrutura obrigatória de campo com erro
<div className="form-field">
  <label htmlFor="ra">
    RA do Aluno
    <span className="text-danger" aria-hidden="true"> *</span>
    <span className="sr-only"> (obrigatório)</span>
  </label>
  <input
    id="ra"
    aria-describedby="ra-error"
    aria-invalid="true"
    className="input-field error"
  />
  <p id="ra-error" role="alert" className="text-danger text-caption">
    <ExclamationCircleIcon className="w-4 h-4 inline" aria-hidden="true" />
    O campo RA é obrigatório.
  </p>
</div>
```

### 6.3 KPI Cards (Dashboard)

#### Anatomia

```
┌──────────────────────────────────┐
│  1.247           ↑ +8,3%         │  ← número (28px/700) + trend
│  Alunos Matriculados             │  ← label (12px/text-secondary)
│  ▁▂▄▆▇▇▆▅  (sparkline opcional) │
└──────────────────────────────────┘
```

#### Especificações

| Propriedade | Valor |
|-------------|-------|
| Altura | 96px fixo |
| Padding | 16px |
| Background | `var(--color-surface)` |
| Borda | `1px solid var(--color-border)` |
| Border radius | 6px |
| Número | 28px, weight 700, `tabular-nums`, `IBM Plex Mono` |
| Label | 12px, weight 400, `color: var(--color-text-secondary)` |
| Trend positivo | Seta para cima, `color: var(--color-success)` |
| Trend negativo | Seta para baixo, `color: var(--color-danger)` |
| Sparkline | Opcional, 32px de altura, cor `--color-secondary` com opacidade |

#### Grid de KPI cards

| Viewport | Colunas |
|----------|---------|
| `>= 1280px` | 4 cards em linha |
| `768px – 1279px` | 2 cards em linha |
| `< 768px` | 1 card por linha |

### 6.4 Modal / Dialog

#### Tamanhos

| Variante | Max-width | Uso |
|----------|-----------|-----|
| `sm` | 480px | Confirmações, alertas simples |
| `md` | 640px | Formulários curtos, detalhes |
| `lg` | 960px | Formulários extensos, visualização de documento |

#### Especificações

| Propriedade | Valor |
|-------------|-------|
| Overlay | `rgba(0, 0, 0, 0.5)` |
| Background do painel | `var(--color-surface)` |
| Border radius | 8px |
| Padding interno | 24px |
| Focus trap | `Tab` cicla apenas dentro do modal |
| Fechar via | Botão X + tecla `Escape` + click no overlay |
| Z-index | 100 (acima da sidebar z-50) |

#### Ação destrutiva — padrão obrigatório

```tsx
// ❌ Nunca genérico
<Button variant="danger">Excluir</Button>

// ✅ Sempre explícito com entidade
<Button variant="danger">
  Excluir aluno João da Silva (RA 2024001234)?
</Button>
```

#### Regra contra modais em cascata

**PROIBIDO**: abrir modal dentro de modal. Se a ação secundária requer interação, usar:
- Inline expansion dentro do modal atual
- Sheet lateral (painel deslizante)
- Nova página/rota

### 6.5 Toast Notifications

#### Posição e comportamento

```
                    ┌─────────────────────────────┐
                    │ ✓ Matrícula realizada com    │  ← top-right, 16px das bordas
                    │   sucesso!                   │
                    └─────────────────────────────┘
                    ┌─────────────────────────────┐
                    │ ⚠ Atenção: prazo se encerra │  ← segundo toast (max 3)
                    └─────────────────────────────┘
```

#### Especificações

| Propriedade | Valor |
|-------------|-------|
| Posição | `top-right`, 16px de cada borda |
| Largura | 360px max |
| Border radius | 6px |
| Sombra | `box-shadow: 0 4px 12px rgba(0,0,0,0.15)` |
| Max toasts simultâneos | 3 (novos empurram os antigos para baixo) |
| Borda esquerda (left border) | 4px solid, cor semântica |

#### Variantes e duração

| Variante | Cor da borda | Duração | `aria-live` |
|----------|-------------|---------|-------------|
| `success` | `var(--color-success)` | 5s (auto dismiss) | `polite` |
| `info` | `var(--color-secondary)` | 5s (auto dismiss) | `polite` |
| `warning` | `var(--color-warning)` | 8s (auto dismiss) | `polite` |
| `error` | `var(--color-danger)` | Persistente (dismiss manual) | `assertive` |

```tsx
// Estrutura de toast acessível
<div
  role="status"
  aria-live="polite"  // ou "assertive" para error
  className="toast toast-success"
>
  <CheckCircleIcon className="w-5 h-5 text-success" aria-hidden="true" />
  <p>Matrícula realizada com sucesso.</p>
  <button aria-label="Fechar notificação" onClick={dismiss}>
    <XMarkIcon className="w-4 h-4" aria-hidden="true" />
  </button>
</div>
```

### 6.6 Command Palette (`Ctrl+K`)

#### Especificações

| Propriedade | Valor |
|-------------|-------|
| Trigger | `Ctrl+K` (Windows/Linux) / `Cmd+K` (Mac) |
| Posição | Overlay centralizado, max-width 640px |
| Overlay | `rgba(0,0,0,0.5)`, blur 2px |
| Input | `autofocus`, placeholder "Buscar alunos, turmas, ações..." |
| Border radius | 8px |
| Max altura lista | 400px com scroll |

#### Categorias de resultado

| Categoria | Ícone | Exemplos |
|-----------|-------|----------|
| Alunos | `UserIcon` | João da Silva — RA 2024001234 |
| Turmas | `AcademicCapIcon` | 3º Ano A — Informática |
| Documentos | `DocumentIcon` | Declaração de Matrícula |
| Ações | `BoltIcon` | Nova Matrícula, Emitir Boletim |
| Navegação | `ArrowRightIcon` | Ir para Secretaria > Alunos |

#### Comportamento

- Exibir itens recentes antes de digitar
- Busca fuzzy: `fuse.js` ou solução server-side via API `/api/search?q=`
- `Enter` executa primeira ação / navega para primeiro resultado
- `↑↓` navega entre resultados
- `Escape` fecha

---

## 7. Configuração Tailwind

### `tailwind.config.ts` — extensões obrigatórias

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B4F72',
          hover:   '#154360',
        },
        secondary:  '#2E86AB',
        accent:     '#E67E22',
        success:    '#1E8449',
        warning:    '#D4AC0D',
        danger:     '#C0392B',
        // Neutros semânticos
        bg:         '#F4F6F7',
        surface:    '#FFFFFF',
        border:     '#D5D8DC',
        'text-primary':   '#1A1A2E',
        'text-secondary': '#566573',
        'text-muted':     '#808B96',
        // Estados de tabela
        'stripe':   '#F8F9FA',
        'row-hover':'#EBF5FB',
        'selected': '#D6EAF8',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        caption: ['12px', { lineHeight: '1.5' }],
        body:    ['14px', { lineHeight: '1.5' }],
        label:   ['14px', { lineHeight: '1.5', fontWeight: '500' }],
        section: ['18px', { lineHeight: '1.3' }],
        page:    ['24px', { lineHeight: '1.3' }],
        kpi:     ['28px', { lineHeight: '1.2' }],
      },
      spacing: {
        // Tokens de espaçamento explícitos (adicionais aos defaults)
        'xxs': '4px',
        'xs':  '8px',
        'sm':  '12px',
        // md = 16px (já existe como padrão do Tailwind)
        // lg = 24px (já existe como padrão do Tailwind)
        // xl = 32px, 2xl = 48px, 3xl = 64px (já existem)
      },
      height: {
        topbar:    '48px',
        breadcrumb:'40px',
        input:     '40px',
        'row-default': '40px',
        'row-compact': '32px',
        kpi:       '96px',
      },
      width: {
        sidebar:          '240px',
        'sidebar-collapsed': '64px',
      },
      maxWidth: {
        layout: '1440px',
        'modal-sm': '480px',
        'modal-md': '640px',
        'modal-lg': '960px',
        command:    '640px',
      },
      zIndex: {
        sidebar:  '40',
        topbar:   '50',
        modal:    '100',
        toast:    '200',
        command:  '300',
      },
      boxShadow: {
        // Sombras funcionais (não decorativas)
        toast:  '0 4px 12px rgba(0,0,0,0.15)',
        modal:  '0 20px 60px rgba(0,0,0,0.3)',
        sticky: '0 2px 4px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        DEFAULT: '4px',
        md:      '6px',
        lg:      '8px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};

export default config;
```

### Classes utilitárias customizadas (`globals.css`)

```css
/* Tabelas numéricas — obrigatório em todas as colunas com dados numéricos */
.tabular {
  font-family: theme('fontFamily.mono');
  font-variant-numeric: tabular-nums;
  text-align: right;
}

/* Focus ring padrão do sistema */
.focus-ring {
  outline: 2px solid #2E86AB;
  outline-offset: 2px;
}

/* Skip link — primeiro elemento do DOM */
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  z-index: 9999;
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
}

.skip-link:focus {
  top: 0;
}
```

---

## 8. Checklist de Acessibilidade (WCAG AA)

### Visão geral

O sistema deve atingir conformidade **WCAG 2.1 nível AA** em todos os componentes. Abaixo o checklist executável por componente.

### Contraste de cores

| Requisito | Padrão do sistema | Status |
|-----------|------------------|--------|
| Texto normal (< 18px regular): mínimo 4.5:1 | `text-primary` sobre `surface`: 16:1 | ✅ |
| Texto grande (>= 18px ou 14px bold): mínimo 3:1 | `text-secondary` sobre `surface`: 5.3:1 | ✅ |
| Componentes de UI e gráficos: mínimo 3:1 | Bordas de input `#D5D8DC` sobre branco: 2.1:1 | ⚠️ Mitigar com sombra ou espessura |
| Texto de placeholder: mínimo 4.5:1 | `text-muted` sobre `surface`: 3.9:1 | ⚠️ Nunca usar como único label |

### Navegação por teclado

- [ ] `Tab` order = ordem visual (DOM order)
- [ ] Todos os elementos interativos alcançáveis via teclado
- [ ] Sidebar navegável via teclado (`ArrowUp`/`ArrowDown` entre itens)
- [ ] Modais com focus trap ativo (tab não sai do modal)
- [ ] `Escape` fecha modais, dropdowns, command palette
- [ ] `Ctrl+S` salva formulários
- [ ] `Ctrl+K` abre command palette
- [ ] Tabelas: navegação por células via setas (quando aplicável)
- [ ] Paginação navegável via teclado

### Skip link

```html
<!-- DEVE ser o primeiro elemento do body -->
<a href="#main-content" class="skip-link">
  Ir para o conteúdo principal
</a>

<!-- ... topbar, sidebar ... -->

<main id="main-content" tabindex="-1">
  <!-- conteúdo da página -->
</main>
```

### Focus visível

```css
/* Aplicar em TODOS os elementos interativos */
*:focus-visible {
  outline: 2px solid #2E86AB;
  outline-offset: 2px;
}

/* NUNCA remover outline sem substituir */
/* ❌ *:focus { outline: none; } */
```

### ARIA obrigatórios

| Elemento | ARIA necessário |
|----------|----------------|
| Botões icon-only | `aria-label="Descrição da ação"` |
| Inputs | `<label for="id">` (sempre) |
| Mensagens de erro | `role="alert"` + `aria-describedby` no input |
| Status inválido | `aria-invalid="true"` no input com erro |
| Toasts success/info/warning | `aria-live="polite"` |
| Toasts error | `aria-live="assertive"` |
| Loading state | `aria-busy="true"` no container |
| Modais | `role="dialog"` + `aria-labelledby` (título) + `aria-modal="true"` |
| Sidebar | `role="navigation"` + `aria-label="Menu principal"` |
| Breadcrumb | `role="navigation"` + `aria-label="Caminho"` + `aria-current="page"` no último item |
| Tabela | `<thead>`, `<th scope="col">`, `<caption>` descritiva |
| Checkbox "Selecionar todos" | `aria-label="Selecionar todos os registros da página"` |

### Movimento e animação

```css
/* Respeitar preferência de usuário */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Formulários acessíveis

- [ ] Cada `<input>` tem `<label>` com `for` correspondente ao `id`
- [ ] Nunca usar `placeholder` como único label
- [ ] `required` + asterisco visual + texto `.sr-only`
- [ ] Erros: `role="alert"` + mensagem descritiva (não genérica)
- [ ] Submit desabilitado durante loading com `aria-disabled="true"`
- [ ] Grupos de campos relacionados em `<fieldset>` + `<legend>`

---

## 9. Anti-patterns — Proibido

Estes padrões são **explicitamente proibidos** no sistema. Qualquer componente que viole estas regras deve ser refatorado.

| # | Anti-pattern | Por que é proibido | Solução correta |
|---|---|---|---|
| 1 | **Modais em cascata** | Desorientação do usuário, pilha de z-index impossível de gerenciar | Usar inline expansion, Sheet lateral, ou nova página |
| 2 | **Placeholder como único label** | Desaparece ao digitar; falha WCAG 1.3.1; inacessível | Label sempre acima do campo |
| 3 | **Tabelas sem paginação** | Performance catastrófica com 1000+ registros; inacessível via teclado | Paginação server-side obrigatória, máx 50 itens |
| 4 | **Mensagens de erro genéricas** | "Erro ao salvar" não ajuda o usuário a corrigir | Mensagem específica: "O campo CPF deve conter 11 dígitos" |
| 5 | **Breadcrumbs não-clicáveis** | Usuário espera poder navegar; frustração e perda de eficiência | Todos os segmentos do breadcrumb devem ser links `<a>` |
| 6 | **Status por cor apenas** | Falha de acessibilidade WCAG 1.4.1; invisível para daltônicos | Sempre: ícone + texto + cor |
| 7 | **Auto-logout sem aviso** | Perda de dados; frustração severa em formulários longos | Warning 2 min antes: modal "Sessão expira em 2 minutos. Continuar?" |
| 8 | **`outline: none` sem substituição** | Torna navegação por teclado impossível; falha WCAG 2.4.7 | Substituir por `outline` customizado ou `box-shadow` |
| 9 | **Gradientes em elementos de UI** | Viola Swiss Modernism 2.0; dificulta leitura em telas com brilho | Cores sólidas para UI; gradientes apenas em gráficos de dados |
| 10 | **Loading sem estado visual** | Usuário não sabe se ação foi registrada; clica múltiplas vezes | Sempre: spinner + botão desabilitado durante async |
| 11 | **Colunas numéricas sem `tabular-nums`** | Números "pulam" ao scrollar; leitura comparativa impossível | `font-variant-numeric: tabular-nums` obrigatório em colunas numéricas |
| 12 | **Datas em formato ISO (YYYY-MM-DD)** | Formato estrangeiro para usuários brasileiros | Sempre DD/MM/YYYY na interface (ISO apenas em APIs) |

---

## 10. Mapeamento shadcn/ui

O sistema utiliza **shadcn/ui** como base de componentes, com extensões específicas para o contexto de ERP educacional.

### Componentes base → extensões do sistema

| Componente shadcn/ui | Extensão no sistema | Responsabilidade adicionada |
|---|---|---|
| `Table` | `DataTable` | Paginação server-side, seleção em massa, bulk actions, ordenação, modo compacto, estados loading/empty |
| `Dialog` | `Modal` | Focus trap robusto, tamanhos sm/md/lg, confirmação destrutiva explícita, proibição de cascata |
| `Input` / `Select` / `Textarea` | `FormField` | Label obrigatório acima, focus ring, estados de erro acessíveis, `Ctrl+S` handler |
| `Sheet` | `MobileSidebar` | Drawer de 280px, overlay, animação slide-in, gestão de foco |
| `DropdownMenu` | `UserMenu`, `ContextMenu` | Atalhos de teclado, ícones acessíveis, separadores semânticos |
| `Tabs` | `ModuleNav` | Navegação entre submódulos, estado ativo persistido na URL |
| `Badge` | `StatusBadge` | Variantes semânticas (success/warning/danger/neutral), sempre ícone + texto |
| `Skeleton` | `TableSkeleton`, `CardSkeleton` | Dimensões exatas compatíveis com conteúdo real, animação pulse |
| `Tooltip` | `HelpTooltip` | Trigger via hover + focus, delay 300ms, `role="tooltip"` |
| `Command` | `CommandPalette` | `Ctrl+K` trigger, categorias, itens recentes, busca fuzzy |

### Instalação e configuração

```bash
# Inicializar shadcn/ui
npx shadcn-ui@latest init

# Componentes base necessários
npx shadcn-ui@latest add table dialog input select textarea sheet
npx shadcn-ui@latest add dropdown-menu tabs badge skeleton tooltip command
npx shadcn-ui@latest add button card form toast separator
```

### Customização de tema shadcn (`components.json`)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### Mapeamento de variáveis CSS shadcn → tokens do sistema

```css
/* globals.css — mapear tokens shadcn para tokens do sistema */
@layer base {
  :root {
    --background:         244 246 247;  /* --color-bg */
    --foreground:         26 26 46;     /* --color-text-primary */
    --card:               255 255 255;  /* --color-surface */
    --card-foreground:    26 26 46;
    --primary:            27 79 114;    /* --color-primary */
    --primary-foreground: 255 255 255;
    --secondary:          46 134 171;   /* --color-secondary */
    --secondary-foreground: 255 255 255;
    --destructive:        192 57 43;    /* --color-danger */
    --destructive-foreground: 255 255 255;
    --border:             213 216 220;  /* --color-border */
    --input:              213 216 220;
    --ring:               46 134 171;   /* --color-secondary (focus) */
    --radius:             0.375rem;     /* 6px */
  }
}
```

---

## Referências e dependências

| Pacote | Versão mínima | Uso |
|--------|--------------|-----|
| `@fontsource/ibm-plex-sans` | `^5.0.0` | Tipografia (ou next/font) |
| `@fontsource/ibm-plex-mono` | `^5.0.0` | Monospace para dados |
| `tailwindcss` | `^3.4.0` | Framework CSS |
| `@tailwindcss/forms` | `^0.5.0` | Reset de estilos de form |
| `shadcn/ui` | Latest | Componentes base |
| `@heroicons/react` | `^2.0.0` | Ícones (outline, 20px) |
| `fuse.js` | `^7.0.0` | Busca fuzzy no Command Palette |

---

*Este documento é a fonte de verdade para implementação visual do TOTVS Educacional Frontend. Qualquer desvio deve ser justificado e registrado como ADR (Architecture Decision Record).*
