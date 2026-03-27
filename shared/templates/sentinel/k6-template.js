// SENTINEL k6 Load Test Template
// Generated dynamically from sentinel-recon.json
//
// Usage:
//   k6 run --env BASE_URL=http://localhost:3000 --env ROUTES='["/","/dashboard"]' k6-template.js
//   k6 run --env BASE_URL=http://localhost:3000 --env STAGES='[{"duration":"30s","target":5}]' k6-template.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Configuration from environment
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ROUTES = __ENV.ROUTES ? JSON.parse(__ENV.ROUTES) : ['/'];
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

// Default stages (smoke test)
export const options = {
  stages: __ENV.STAGES
    ? JSON.parse(__ENV.STAGES)
    : [{ duration: '30s', target: 5 }],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.05'],
  },
};

// Headers
const headers = AUTH_TOKEN
  ? { Authorization: `Bearer ${AUTH_TOKEN}` }
  : {};

export default function () {
  // Pick random route
  const route = ROUTES[Math.floor(Math.random() * ROUTES.length)];
  const url = `${BASE_URL}${route}`;

  const res = http.get(url, { headers, timeout: '10s' });

  // Check response
  const success = check(res, {
    'status is 2xx or 3xx': (r) => r.status >= 200 && r.status < 400,
    'response time < 2s': (r) => r.timings.duration < 2000,
    'response body not empty': (r) => r.body && r.body.length > 0,
  });

  // Record metrics
  errorRate.add(!success);
  responseTime.add(res.timings.duration);

  // Pause between requests (simulate real user)
  sleep(Math.random() * 2 + 0.5); // 0.5-2.5s
}

// Stages presets (use via --env STAGES='...')
//
// SMOKE:     [{"duration":"30s","target":5}]
// LOAD:      [{"duration":"30s","target":10},{"duration":"2m","target":50},{"duration":"30s","target":0}]
// STRESS:    [{"duration":"30s","target":50},{"duration":"2m","target":100},{"duration":"30s","target":0}]
// SPIKE:     [{"duration":"10s","target":5},{"duration":"10s","target":200},{"duration":"30s","target":5}]
// ENDURANCE: [{"duration":"30s","target":30},{"duration":"5m","target":30},{"duration":"30s","target":0}]
