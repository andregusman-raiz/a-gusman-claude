---
id: contract-lifecycle
name: Contract Lifecycle Management (CLM)
category: Workflow
source: raiz-platform
complexity: Muito Alta
tags: [contract, risk, negotiation, approval, signature, ai]
---

# Contract Lifecycle Management

## What it solves
Full contract lifecycle: create → negotiate → AI risk analysis → approval → signature, with a 2D risk matrix and typed negotiation rounds.

## Best implementations
- `~/Claude/GitHub/raiz-platform/src/components/clm/ai/RiskAnalysisView.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/clm/contracts/ContractNegotiationPanel.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/clm/contracts/ContractVersionHistory.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/clm/ai/ClauseSuggestions.tsx`
- `~/Claude/GitHub/raiz-platform/src/components/clm/contracts/ContractSignaturePanel.tsx`

## Key features
- **Risk matrix**: 3×3 impact/likelihood grid rendered as SVG
- **7 risk categories**: legal, financial, operational, compliance, counterparty, strategic, reputational
- **Confidence gauge**: circular SVG showing AI confidence score
- **Negotiation rounds**: proposal → counter_proposal → accepted → rejected → comment
- **Actor types**: internal vs external with attribution
- **Version history**: document versions with diff tracking
- **Clause suggestions**: AI-generated clause improvements

## Types
```ts
interface RiskFactorAnalysis {
  category: 'legal' | 'financial' | 'operational' | 'compliance' | 'counterparty' | 'strategic' | 'reputational';
  factor: string;
  impact: 'low' | 'medium' | 'high';
  likelihood: 'low' | 'medium' | 'high';
  score: number; // 0-1
  mitigation_suggestion?: string;
}

interface NegotiationRound {
  round_number: number;
  action: 'proposal' | 'counter_proposal' | 'accepted' | 'rejected' | 'comment';
  actor_type: 'internal' | 'external';
  actor_name: string;
  content?: string;
  affected_clauses?: string[];
}
```

## Dependencies
- AI risk analysis service
- SVG for risk matrix rendering
