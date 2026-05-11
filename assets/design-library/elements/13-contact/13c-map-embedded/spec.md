# 13c — Mapa Embedado + Formulario

## Quando usar
- Empresa com endereco fisico relevante (varejo, escritorio aberto a visitas).
- Marketplaces locais, restaurantes, imoveis — cliente quer visualizar.
- Eventos com local fisico especifico.

## Quando NAO usar
- Empresa 100% remota.
- Multiplos enderecos (use `13b-channel-cards` ou lista com acordeon).
- Privacidade do endereco (home office pessoal).

## Props principais
- `mapSrc`: URL iframe do Google Maps, Mapbox ou OpenStreetMap. Se omitido, placeholder.
- `className`: override.

## Dependencias
- `react` com `useState` para form.
- `lucide-react` (`MapPin`, `Send`).
- Tailwind.

## Variacoes
- Mapa interativo Mapbox GL JS (em vez de iframe).
- Multi-pin para multiplos enderecos.
- CEP lookup no form para calcular distancia.
- Botao "Abrir no Google Maps" embaixo do mapa.

## Anti-patterns
- Iframe sem `loading="lazy"` (penaliza LCP).
- Iframe sem `title` (falha a11y).
- Endereco apenas no mapa (sem copia textual).
- Mapa ocupando mais de 60% sem necessidade.
