---
id: contractor-management
name: PJ Contractor Management
category: Forms
source: sistema-gestao-pj-raiz
complexity: Alta
tags: [pj, contractor, onboarding, payment, cnpj, bulk-import]
---

# PJ Contractor Management

## What it solves
Independent contractor (PJ) onboarding, payment lifecycle, and bulk import with row-level validation.

## Best implementations
- `https://github.com/Raiz-Educacao-SA/sistema-gestao-pj-raiz/blob/main/src/components/PJRegistrationForm.tsx` (22KB)
- `https://github.com/Raiz-Educacao-SA/sistema-gestao-pj-raiz/blob/main/src/components/PaymentForm.tsx` (19KB)
- `https://github.com/Raiz-Educacao-SA/sistema-gestao-pj-raiz/blob/main/src/components/ImportModule.tsx`
- `https://github.com/Raiz-Educacao-SA/sistema-gestao-pj-raiz/blob/main/src/components/PaymentHistory.tsx`

## Key features
- **Multi-section registration**: CNPJ validation, banking info, benefits, contract terms
- **Payment forms**: RPA vs Nota Fiscal submission with different field requirements
- **Bulk CSV import**: upload → preview → row-level validation → import
- **Payment history**: timeline of all payments with status and documents
- **Reports dashboard**: PJ costs, payments pending, tax summary

## Flow
```
Onboarding:
  CNPJ Input → Validate → Personal Data → Banking → Benefits → Contract → Submit

Payment:
  Select PJ → RPA or NF → Fill amounts → Attach docs → Submit for approval

Import:
  Upload CSV → Preview table → Validate rows → Show errors → Import valid
```

## Dependencies
- CNPJ validation service
- React (Vite, no Next.js)
