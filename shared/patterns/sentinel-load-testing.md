# SENTINEL Load Testing Patterns (k6)

## Cenarios

### 1. Smoke Test (todos os modos)
```
VUs: 5 | Duracao: 30s | Threshold: p95 < 1s, errors < 1%
Proposito: Verificar que app responde sob carga minima
```

### 2. Load Test (HYBRID + OFFENSIVE)
```
VUs: ramp 10 -> 50 | Duracao: 2min | Threshold: p95 < 2s, errors < 5%
Proposito: Carga normal de uso diario
```

### 3. Stress Test (OFFENSIVE only)
```
VUs: ramp 50 -> 100 | Duracao: 2min | Threshold: p95 < 5s, errors < 10%
Proposito: Acima da capacidade esperada
```

### 4. Spike Test (OFFENSIVE only)
```
VUs: 0 -> 200 burst | Duracao: 30s | Threshold: no crash, recovery < 30s
Proposito: Pico subito de trafego
```

### 5. Endurance Test (OFFENSIVE only)
```
VUs: 30 constant | Duracao: 5min | Threshold: p95 estavel, no memory leak
Proposito: Detectar degradacao ao longo do tempo
```

## Metricas Capturadas

| Metrica | Descricao | Healthy |
|---------|-----------|---------|
| http_req_duration p50 | Mediana | < 500ms |
| http_req_duration p90 | Percentil 90 | < 1s |
| http_req_duration p95 | Percentil 95 | < 2s |
| http_req_duration p99 | Percentil 99 | < 5s |
| http_reqs | Total requests | Crescente com VUs |
| http_req_failed | Taxa de erro | < 5% |
| vus | Usuarios virtuais | Conforme stage |
| data_received | Throughput | Estavel |

## Script k6 Template

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

// Rotas geradas de sentinel-recon.json
const ROUTES = __ENV.ROUTES ? JSON.parse(__ENV.ROUTES) : ['/'];
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: JSON.parse(__ENV.STAGES || '[{"duration":"30s","target":5}]'),
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  const route = ROUTES[Math.floor(Math.random() * ROUTES.length)];
  const res = http.get(BASE_URL + route);
  check(res, {
    'status is 200-399': (r) => r.status >= 200 && r.status < 400,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });
  sleep(1);
}
```

## Regras de Seguranca

- PRODUCAO: max 5 VUs, smoke only, NUNCA load/stress/spike
- STAGING: max 50 VUs, smoke + load
- LOCAL: max 200 VUs, todos os cenarios
- NUNCA rodar load test sem antes confirmar o ambiente
- NUNCA rodar spike/stress em infra compartilhada sem aviso
