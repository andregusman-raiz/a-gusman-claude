---
id: forms-multistep
name: Dynamic Form Engine with Runtime Validation
category: forms
source: ticket-raiz
complexity: very-high
---

# Dynamic Form Engine

## What it solves
Render forms from database-driven schemas with per-step field visibility, runtime Zod validation, 14+ field types, and formula-computed fields.

## Best implementation
- **DynamicForm**: `~/Claude/GitHub/ticket-raiz/src/components/bpms/forms/dynamic-form.tsx`
- **Form Engine**: `~/Claude/GitHub/ticket-raiz/src/lib/bpms/forms/form-engine.ts`
- **Process Start**: `~/Claude/GitHub/ticket-raiz/src/components/bpms/start/process-start-form.tsx`

## Key features
- **Schema from DB**: FormSchema fetched per process step, not hardcoded
- **Runtime Zod**: `buildZodSchema(fields, values, stepId)` constructs validator dynamically
- **14+ field types**: text, select, radio, checkbox, currency, rating, table, user-picker, CEP, CPF, CNPJ, file, date, formula
- **Field visibility**: hidden/readonly/visible resolved per-field against current values
- **Formula fields**: auto-computed via `useFormulaFields` hook
- **External submit**: RHF instance passed from parent, allowing external submit buttons
- **Masked inputs**: CPF, CNPJ, CEP with validation

## Props interface
```ts
interface DynamicFormProps {
  schema: FormSchema;
  form: UseFormReturn;
  readOnly?: boolean;
  currentStepId?: string;
  instructions?: string;
}
```

## Dependencies
- react-hook-form, @hookform/resolvers/zod
- zod (runtime schema construction)
- shadcn/ui form components
- lucide-react
