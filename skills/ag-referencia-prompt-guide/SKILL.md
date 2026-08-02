---
name: ag-referencia-prompt-guide
description: "Guia canonico de prompts para gerar UI em Claude/Cursor/Lovable/v0. Estrutura 6 blocos (Contexto/Layout/Estilo/Refs/Constraints/Entregavel). Invocar ANTES de pedir geracao de UI."
metadata:
  filePattern:
    - "**/app/(marketing)/**"
    - "**/app/(auth)/**"
    - "**/components/landing/**"
    - "**/prompt*.md"
  priority: 85
---

# Prompt Guide — Gerar UI via AI

> Inspirado em GlowUp UI (glowupui.io) e validado com o design-library rAIz.
> Complementa `/ag-referencia-design-presentation` (taxonomia de 86 layouts).
> Uso: antes de qualquer geração de UI via Claude/Cursor/Lovable/v0.
---

## Princípio

**Builder AI gera o que você descreve, não o que você quer.** Prompt fraco = 5-15 iterações queimando créditos. Prompt estruturado = 1-2 shots para resultado utilizável.

A diferença entre um prompt que queima tempo e um que acerta está em **quantos tipos de informação** ele carrega, não em quão longo é.

---

## Estrutura canônica — 6 blocos

Todo prompt de UI bom tem estes 6 blocos (nesta ordem):

```
1. Contexto       → quem usa, para quê, em que produto
2. Layout base    → qual a estrutura geométrica pretendida
3. Estilo         → identidade visual + tokens (cores, radius, tipografia, spacing)
4. Referências    → screenshots, URLs de inspiração, ID de variante do design-library
5. Constraints    → stack, dependências permitidas, tamanho, a11y, mobile
6. Entregável     → formato (1 arquivo? múltiplos? spec markdown? prompt otimizado?)
```

**Skippar qualquer bloco = AI inventa.** Exceção: Referências é opcional se o layout é simples ou se #1 e #2 já são precisos.

---

## Template mestre

Copiar e preencher placeholders:

```
# Build: <NOME CURTO DO COMPONENTE>

## Contexto
Você é um designer senior implementando uma seção de <CATEGORIA> para <TIPO DE PRODUTO>.
Usuário final: <PERSONA>. Objetivo: <O QUE O USUÁRIO DEVE FAZER/SENTIR>.

## Layout base
<DESCRIÇÃO ESTRUTURAL EM 1-2 FRASES — ex: "layout 50/50 desktop, stack mobile, form à esquerda, visual à direita">

## Estilo (design tokens)
- Cor primária: <HEX + nome CSS var>
- Cor secundária: <HEX + nome CSS var>
- Radius: <VALOR> (ex: 0.75rem = rounded-xl)
- Typography: <FONT FAMILY + TRACKING>
- Dark mode: <class strategy | data-attribute | nenhum>
- Spacing: <8pt grid | 4pt grid | custom>
- Shadows: <subtle | pronounced | nenhum>

## Referências
- Design-library: <ID da variante — ex: 04b-split-text-image>
- Screenshots: <anexar ou descrever>
- URL inspiração: <opcional>
- Preset estético: <raiz-default | minimalist | brutalist | glass | outro>

## Constraints (stack rAIz)
- React 19 + TypeScript strict
- Tailwind v4 + shadcn/ui
- lucide-react para ícones (sem outras libs de icon)
- Mobile-first: `md:` e `lg:` para breakpoints
- Acessibilidade: aria-labels em elementos interativos sem texto, focus rings visíveis, labels em forms
- Placeholder content em PT-BR
- Tamanho: 50-200 linhas
- Sem business logic — apenas UI + handlers placeholder (`onClick?: () => void`)

## Entregável
<1 arquivo .tsx self-contained | múltiplos arquivos com estrutura X/Y/Z | spec markdown | prompt otimizado para v0>
```

---

## Templates por alvo

### Alvo: Claude (via Cursor, chat, API)

Use o **template mestre completo**. Claude responde bem a metadados ricos e contexto longo.

Otimização extra: começar com `<task>...</task>` XML tag e terminar com `<format>1 arquivo TSX, sem explicações prévias ou posteriores — só o código</format>`.

### Alvo: Cursor (inline chat ou composer)

Cursor usa Claude por baixo, mas com contexto limitado. Versão condensada:

```
Contexto: <produto> — <persona> — <objetivo em 1 frase>
Layout: <estrutura em 1 frase, base na variante <ID do library>>
Estilo: Raiz tokens (laranja #FF6D00, teal #006E6A, rounded-xl, Inter, dark mode via class)
Stack: React 19 + Tailwind v4 + shadcn + lucide-react
Entregável: 1 arquivo .tsx, PT-BR, mobile-first, a11y básica
```

### Alvo: v0.dev (Vercel)

v0 tem tom mais visual. Prompt deve focar em **aparência** mais que em contexto:

```
<estética — ex: "clean, minimal, startup SaaS">
<layout — ex: "hero com título giant, subtítulo, 2 CTAs centralizados, background gradient suave">
<detalhes visuais — ex: "pílulas arredondadas, sombra sutil, tipografia grotesk">
<responsive notes — ex: "mobile: tipografia reduz para 6xl, CTAs stack">
```

v0 ignora muito contexto de negócio. Mantenha visual.

### Alvo: Lovable

Lovable gera app completo, não componente isolado. Prompt deve incluir:
- Nome do produto
- Jornada do usuário
- Telas relacionadas (para Lovable não criar contradição)
- Estilo visual

Template:

```
Projeto: <nome>
Descrição: <o que faz em 2 frases>
Tela atual: <qual tela dessa jornada>
Layout desejado: <descrição>
Tokens visuais: <cores/radius/font>
Relacionadas: <outras telas que Lovable já criou — evita inconsistência>
```

---

## Exemplos reais por categoria (14)

### 01 — Auth

```
# Build: Login com magic link

## Contexto
App SaaS de gestão educacional rAIz. Usuário: coordenador pedagógico, entra no app 3-5x/dia.
Objetivo: autenticar via e-mail institucional sem senha.

## Layout base
Card centralizado em viewport neutro. Logo rAIz no topo, form simples, mensagem de confirmação.

## Estilo
- Primária: #FF6D00 (orange)
- Radius: 0.75rem
- Dark mode: class strategy
- Typography: Inter

## Referências
- Design-library: 01e-magic-link-only
- Preset: raiz-default

## Constraints
- Next.js 16 + Supabase Auth
- Server Action para dispatch do magic link
- PT-BR

## Entregável
1 arquivo `app/login/page.tsx` + 1 server action
```

### 04 — Hero

```
# Build: Hero de landing de plataforma de ensino

## Contexto
Landing pública para captar leads. Visitantes: diretores escolares avaliando contratação.

## Layout base
Hero split 50/50: texto+CTAs à esquerda, screenshot do dashboard com drop shadow dramático à direita.

## Estilo
Raiz default — laranja como primary CTA, teal como secundária. Serif no H1 para sensação premium.

## Referências
- Library: 04b-split-text-image
- Preset: raiz-default

## Constraints
- Stack rAIz padrão (Next 16 + Tailwind v4 + shadcn)
- Mobile: stack vertical, screenshot vira thumbnail clicável
- H1 com máx 10 palavras

## Entregável
1 arquivo TSX
```

### 14 — States

```
# Build: Estado vazio de dashboard

## Contexto
Primeiro acesso do admin — dashboard sem dados ainda.

## Layout base
SVG ilustrativo central (raiz estilizada) + heading + descrição + CTA "Importar dados" + link "Começar com dados de exemplo".

## Estilo
Raiz default mais soft — sem orange aggressive, paleta neutra com 1 accent teal no CTA.

## Referências
- Library: 14c-empty-state-illustration

## Constraints
- SVG inline (não externo)
- Altura min 480px
- PT-BR

## Entregável
1 componente .tsx
```

---

## Anti-patterns (o que NUNCA fazer)

### Prompt vago

❌ "Crie um hero bonito"
❌ "Faz uma landing page de SaaS"
❌ "Preciso de um login profissional"

✅ Use template mestre com blocos 1-6 preenchidos.

### Prompt de negócio sem estética

❌ "É um SaaS de gestão educacional para diretores, captamos leads, preciso de landing"

Sem bloco de estilo/tokens, AI inventa. Melhor: "É um SaaS de gestão educacional [contexto]... **Estilo: Raiz tokens #FF6D00 + #006E6A, rounded-xl, Inter, dark mode via class** [continua]".

### Prompt de estética sem contexto

❌ "Hero minimalist, giant typography, neutral palette"

AI faz genérico. Adicione: "para **quem** é? **qual ação** o hero leva?".

### Mudança de escopo no meio

❌ Começar pedindo login e no meio do prompt mudar para dashboard.

Um prompt = uma entrega. Se precisa de múltiplas telas, fazer múltiplas prompts ou pedir explicitamente "fluxo de 3 telas: X → Y → Z" com estrutura para cada.

### "Como o Stripe / Linear / Vercel"

Útil como referência **adicional**, nunca como único descritor. AI interpreta "como Stripe" de N jeitos. Combinar: "Estética com Stripe (neutra, ultra-polida, tipografia tight), **mas com** <seus tokens>".

### Ignorar mobile

❌ Esquecer de mencionar mobile → AI entrega desktop-only.
✅ Sempre incluir "mobile-first" ou "responsive desktop/tablet/mobile" nos Constraints.

### Ignorar a11y

❌ Deixar pra "depois" → AI gera sem aria-labels, sem focus rings.
✅ Sempre incluir "aria-labels em botões sem texto, focus rings visíveis, labels em forms" nos Constraints.

---

## Integração com design-library rAIz

O app em `/presentation/<categoria>/<id>` já tem botão **"Copy as AI prompt"** que gera prompt pronto para colar em Claude/Cursor/v0, seguindo o template mestre acima + incorporando o preset selecionado + o id da variante.

Workflow recomendado:

```
1. Navegar /presentation, filtrar por categoria
2. Escolher variante visualmente (compare view ajuda)
3. Escolher preset estético
4. Clicar "Copy as AI prompt" + selecionar alvo (Claude/Cursor/v0)
5. Colar em Lovable/Cursor/Composer
6. Receber resultado em 1-2 iterações
```

Se o resultado falhar: abrir o prompt gerado, ver qual bloco está vago, completar manualmente.

---

## Checklist final antes de enviar prompt

- [ ] Bloco 1 (Contexto) — persona + objetivo + produto
- [ ] Bloco 2 (Layout) — descrição estrutural em 1-2 frases
- [ ] Bloco 3 (Estilo) — tokens específicos (hex, radius, font)
- [ ] Bloco 4 (Referências) — ID da variante OU screenshot OU URL
- [ ] Bloco 5 (Constraints) — stack + a11y + mobile + placeholder idioma
- [ ] Bloco 6 (Entregável) — formato de output
- [ ] Alvo (Claude/Cursor/v0/Lovable) — ajustei tom para o modelo?
- [ ] Anti-patterns — sem "bonito", sem "como o Stripe", sem vago

---

## Quando este guide NÃO se aplica

- **Protótipos ultra-rápidos** onde você aceita resultado genérico — use prompt direto de 1 linha
- **Componentes internos** que reutilizam library existente — copy-paste do library é melhor
- **Mudanças pequenas** em componentes existentes — edição cirúrgica via Cursor inline é melhor
- **Features com muita lógica** — AI gera UI, lógica vem de backend/domain separadamente

---

## Referências

- Design library: `~/Claude/assets/design-library/`
- Taxonomia completa: `/ag-referencia-design-presentation`
- Machine wrapper: `/ag-11-ux-ui`
- Fonte de inspiração: glowupui.io (prompt templates comerciais)
- Princípios UX: vibeui.online (92 padrões de layouts)
