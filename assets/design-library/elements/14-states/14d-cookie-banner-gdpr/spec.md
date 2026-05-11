# 14d — Banner de Cookies GDPR/LGPD

## Quando usar
- Sites com usuarios UE/Brasil (GDPR/LGPD exigem consent opt-in).
- Qualquer app que use analytics, remarketing ou cookies nao essenciais.
- Antes de carregar scripts terceiros (delay ate aceitacao).

## Quando NAO usar
- Apps internos com termos ja aceitos no login.
- Sites 100% sem cookies (raro).
- Usuario ja deu consent (persistir em cookie/localStorage).

## Props principais
- `policyHref`: link da politica de privacidade.
- `onAcceptAll`: aceite de todos os cookies.
- `onCustomize`: abre modal granular (essenciais / analytics / marketing).
- `onDismiss`: fecha sem aceitar (tratar como recusa).

## Dependencias
- `react` com `useState`.
- `lucide-react` (`Cookie`, `X`).
- Tailwind.

## Variacoes
- Banner centralizado em modal full-screen (mais agressivo).
- Com toggles inline (sem modal de customizar).
- Integracao com Cookiebot/OneTrust.
- Sticky sidebar em vez de bottom banner.

## Anti-patterns
- Dark pattern: "Aceitar" destacado vs "Customizar" escondido (LGPD proibe).
- Banner bloqueando conteudo sem opcao de recusar.
- Sem persistencia — banner reaparece toda sessao.
- Cookies disparados antes do consent.
