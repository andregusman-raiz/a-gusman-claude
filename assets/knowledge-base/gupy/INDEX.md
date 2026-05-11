# Gupy Knowledge Base — Index

**Last Updated**: 25/03/2026
**Total Files**: 4 documents
**Total Lines**: 2,500+
**Coverage**: Complete platform research + API docs + integrations

---

## 📚 Documentation Structure

### 1. **GUPY-COMPLETE-RESEARCH.md** (Main Document)
**Status**: ✅ Complete
**Length**: ~1,200 lines
**Focus**: Comprehensive research

**Contents**:
- Company overview (founded 2015, São Paulo)
- 5 core products (R&S, Admissão, Educação, Climate, Performance)
- Complete API documentation (endpoints, auth, webhooks)
- Data models and entities
- Rate limiting and error handling
- Integrations overview
- Pricing/plans
- Best practices
- Security checklist

**When to use**: General reference, complete picture of Gupy platform

---

### 2. **GUPY-API-REFERENCE.md** (Quick Reference)
**Status**: ✅ Complete
**Length**: ~400 lines
**Focus**: API quick lookup

**Contents**:
- Quick start (get token, test endpoint, webhooks)
- Base URL and authentication
- All endpoints organized by resource
- Webhook event payloads
- Response codes
- Rate limiting details
- Pagination patterns
- Common code examples (Node.js, Python, cURL)
- Troubleshooting table

**When to use**: During development, quick API lookups, code snippets

---

### 3. **GUPY-INTEGRATIONS-DETAILED.md** (Integration Guide)
**Status**: ✅ Complete
**Length**: ~900 lines
**Focus**: Real-world integrations

**Sections**:
- **RM TOTVS Integration** (detailed)
  - Fluxo automático
  - Campos FOPFunc + FopDependData
  - Mapeamento de cargos
  - Suporte a dependentes estrangeiros
  - Erros comuns & soluções

- **Other Payroll Systems** (ADP, Senior, Metadados)

- **Low-code Automation** (detailed)
  - n8n: Complete workflow setup
  - Zapier: Zap creation
  - Make.com: Scenario building
  - LinkAPI: REST wrapper
  - Digibee: iPaaS native connectors

- **Real-world Scenarios**
  - Auto-onboarding flows
  - Payroll integration
  - Analytics dashboards
  - End-to-end hiring to payroll

- **Troubleshooting** & best practices

**When to use**: Planning integrations, setup guides, troubleshooting

---

### 4. **INDEX.md** (This File)
**Status**: ✅ This document
**Length**: ~300 lines
**Focus**: Navigation & structure

---

## 🎯 Quick Navigation by Use Case

### I want to...

#### **Understand Gupy**
→ Start with [GUPY-COMPLETE-RESEARCH.md](./GUPY-COMPLETE-RESEARCH.md), sections 1-2

#### **Set up API integration**
→ [GUPY-API-REFERENCE.md](./GUPY-API-REFERENCE.md) + [GUPY-COMPLETE-RESEARCH.md](./GUPY-COMPLETE-RESEARCH.md) section 3

#### **Generate API token**
→ [GUPY-API-REFERENCE.md](./GUPY-API-REFERENCE.md), "Quick Start" + [GUPY-COMPLETE-RESEARCH.md](./GUPY-COMPLETE-RESEARCH.md) section 3.2

#### **Use webhooks for events**
→ [GUPY-API-REFERENCE.md](./GUPY-API-REFERENCE.md), "Webhook Events" + [GUPY-INTEGRATIONS-DETAILED.md](./GUPY-INTEGRATIONS-DETAILED.md) section 5-8

#### **Integrate with RM TOTVS payroll**
→ [GUPY-INTEGRATIONS-DETAILED.md](./GUPY-INTEGRATIONS-DETAILED.md) section 1 (complete RM TOTVS integration guide)

#### **Setup n8n automation**
→ [GUPY-INTEGRATIONS-DETAILED.md](./GUPY-INTEGRATIONS-DETAILED.md) section 5 (step-by-step n8n setup)

#### **Setup Zapier automation**
→ [GUPY-INTEGRATIONS-DETAILED.md](./GUPY-INTEGRATIONS-DETAILED.md) section 6

#### **See all API endpoints**
→ [GUPY-API-REFERENCE.md](./GUPY-API-REFERENCE.md), "Core Endpoints" section

#### **Check pricing and plans**
→ [GUPY-COMPLETE-RESEARCH.md](./GUPY-COMPLETE-RESEARCH.md) section 7

#### **Troubleshoot webhook**
→ [GUPY-INTEGRATIONS-DETAILED.md](./GUPY-INTEGRATIONS-DETAILED.md) section 11 (troubleshooting) + [GUPY-API-REFERENCE.md](./GUPY-API-REFERENCE.md) "Troubleshooting"

#### **See real-world integration example**
→ [GUPY-INTEGRATIONS-DETAILED.md](./GUPY-INTEGRATIONS-DETAILED.md) section 10 (complete 30-day hiring flow)

---

## 📊 Information Architecture

```
Gupy Knowledge Base
├── GUPY-COMPLETE-RESEARCH.md .................. Comprehensive (1,200 lines)
│   ├── 1. Company Overview
│   ├── 2. Products & Modules (5 pillars)
│   ├── 3. API Documentation
│   │   ├── 3.1 Authentication
│   │   ├── 3.2 Token Generation
│   │   ├── 3.3 Endpoints (Jobs, Apps, Candidates, etc.)
│   │   ├── 3.4 Webhooks
│   │   ├── 3.5 Data Models
│   │   ├── 3.6 Rate Limiting
│   │   ├── 3.7 Error Handling
│   │   └── 3.8 Pagination
│   ├── 4. Integration Flows
│   ├── 5. Integrations Overview
│   ├── 6. Pricing & Plans
│   ├── 7. Best Practices
│   ├── 8. Security Checklist
│   ├── 9. Resources
│   ├── 10. Executive Summary
│   └── 11. Next Steps
│
├── GUPY-API-REFERENCE.md ..................... Quick Lookup (400 lines)
│   ├── Quick Start
│   ├── Base URL & Auth
│   ├── Core Endpoints
│   │   ├── Jobs
│   │   ├── Applications
│   │   ├── Candidates
│   │   ├── Departments
│   │   ├── Job Roles
│   │   ├── Branches
│   │   ├── Users
│   │   └── Webhooks
│   ├── Webhook Events
│   ├── Webhook Setup
│   ├── Response Codes
│   ├── Rate Limiting
│   ├── Pagination
│   ├── Common Payloads
│   ├── Code Examples
│   ├── Libraries & SDKs
│   ├── Security Checklist
│   └── Troubleshooting
│
├── GUPY-INTEGRATIONS-DETAILED.md ............ Implementation (900 lines)
│   ├── 1. RM TOTVS Integration (detailed)
│   │   ├── 1.1 Overview
│   │   ├── 1.2 Automatic Flow
│   │   ├── 1.3 Data Transfer (FOPFunc + FopDependData)
│   │   ├── 1.4 Contract Type Mapping
│   │   ├── 1.5 Dependent Relationship Codes
│   │   ├── 1.6 Technical Setup
│   │   ├── 1.7 Foreign Dependents
│   │   ├── 1.8 Common Errors
│   │   └── 1.9 Expected Results
│   ├── 2. ADP Integration
│   ├── 3. Senior RH Integration
│   ├── 4. Metadados Integration
│   ├── 5. n8n Automation
│   ├── 6. Zapier Automation
│   ├── 7. Make.com
│   ├── 8. Digibee
│   ├── 9. LinkAPI
│   ├── 10. End-to-End Flow (Real scenario)
│   ├── 11. Troubleshooting
│   └── 12. Best Practices
│
└── INDEX.md ................................. This Navigation File
```

---

## 🔍 Content Summary by Topic

### Company & Platform
| Topic | Document | Section |
|-------|----------|---------|
| Company history | COMPLETE | 1 |
| Products overview | COMPLETE | 2 |
| Market position | COMPLETE | 1 |
| Investor info | COMPLETE | 1 |

### API & Authentication
| Topic | Document | Section |
|-------|----------|---------|
| API base URL | REFERENCE | "Base URL" |
| Getting token | COMPLETE | 3.2 |
| Bearer auth | REFERENCE | "Authentication" |
| Token security | COMPLETE | 3.2 |
| Permissions | COMPLETE | 3.2 |

### API Endpoints
| Topic | Document | Section |
|-------|----------|---------|
| Jobs | REFERENCE | "Jobs" |
| Applications | REFERENCE | "Applications" |
| Candidates | REFERENCE | "Candidates" |
| All endpoints | COMPLETE | 3.3 |
| v1 vs v2 | COMPLETE | 3.3 |

### Webhooks
| Topic | Document | Section |
|-------|----------|---------|
| Webhook setup | COMPLETE | 3.4 |
| Events available | REFERENCE | "Webhook Events" |
| Payloads (samples) | REFERENCE | "Webhook Events" |
| Retry logic | COMPLETE | 3.4 |
| Timeout (30s) | REFERENCE | "Webhook Setup" |

### Data Models
| Topic | Document | Section |
|-------|----------|---------|
| Job entity | COMPLETE | 3.5 |
| Application entity | COMPLETE | 3.5 |
| Candidate entity | COMPLETE | 3.5 |
| All entities | COMPLETE | 3.5 |

### Rate Limiting & Performance
| Topic | Document | Section |
|-------|----------|---------|
| Rate limit (900/min) | COMPLETE | 3.6 |
| Strategies | COMPLETE | 3.6 |
| Error handling | COMPLETE | 3.7 |
| Pagination | COMPLETE | 3.8 |

### Integrations
| Topic | Document | Section |
|-------|----------|---------|
| RM TOTVS | INTEGRATIONS | 1 (detailed) |
| ADP | INTEGRATIONS | 2 |
| Senior | INTEGRATIONS | 3 |
| n8n | INTEGRATIONS | 5 |
| Zapier | INTEGRATIONS | 6 |
| Make.com | INTEGRATIONS | 7 |
| Digibee | INTEGRATIONS | 8 |
| LinkAPI | INTEGRATIONS | 9 |
| End-to-end | INTEGRATIONS | 10 |

### Payroll Integration
| Topic | Document | Section |
|-------|----------|---------|
| Flow diagram | INTEGRATIONS | 1.2 |
| FOPFunc (employee) | INTEGRATIONS | 1.3 |
| FopDependData | INTEGRATIONS | 1.3 |
| Setup Gupy | INTEGRATIONS | 1.6 |
| Contract types | INTEGRATIONS | 1.4 |
| Dependent codes | INTEGRATIONS | 1.5 |
| Errors & fixes | INTEGRATIONS | 1.8 |

### n8n Integration
| Topic | Document | Section |
|-------|----------|---------|
| Overview | INTEGRATIONS | 5.1 |
| Flow diagram | INTEGRATIONS | 5.2 |
| Step-by-step setup | INTEGRATIONS | 5.3 |
| Example workflows | INTEGRATIONS | 5.4 |

### Security
| Topic | Document | Section |
|-------|----------|---------|
| Token security | COMPLETE | 3.2 |
| Best practices | COMPLETE | 8 |
| DO's and DON'Ts | COMPLETE | 8 |
| Checklist | REFERENCE | "Security Checklist" |

### Pricing
| Topic | Document | Section |
|-------|----------|---------|
| Plans (Professional/Premium/Enterprise) | COMPLETE | 7 |
| API availability | COMPLETE | 7 |
| Pricing table | COMPLETE | 7 |

---

## 📖 How to Use This Knowledge Base

### For Quick Lookups
1. Check **[GUPY-API-REFERENCE.md](./GUPY-API-REFERENCE.md)** first (400 lines, easy scan)
2. Jump to specific section using table of contents
3. Find code examples, endpoint URLs, status codes

### For Deep Dives
1. Read **[GUPY-COMPLETE-RESEARCH.md](./GUPY-COMPLETE-RESEARCH.md)** sections 1-3 (understand platform + API)
2. Review sections 4-5 (integration capabilities)
3. Reference section 8 (best practices)

### For Implementation
1. Start with use case section in [GUPY-INTEGRATIONS-DETAILED.md](./GUPY-INTEGRATIONS-DETAILED.md)
2. Follow step-by-step setup guides
3. Use code examples from [GUPY-API-REFERENCE.md](./GUPY-API-REFERENCE.md)
4. Check troubleshooting sections if issues arise

### For Teaching/Training
1. **Level 1 (Overview)**: Sections 1-2 of COMPLETE-RESEARCH
2. **Level 2 (Getting Started)**: All of API-REFERENCE
3. **Level 3 (Advanced Integration)**: INTEGRATIONS-DETAILED + section 3 of COMPLETE-RESEARCH
4. **Level 4 (Troubleshooting)**: Section 11 of INTEGRATIONS-DETAILED

---

## 🔗 Related Knowledge Base

This Gupy KB can be integrated with:
- **TOTVS KB**: `~/Claude/assets/knowledge-base/totvs/` — For RM details
- **N8N KB**: When available — Workflow templates
- **Zapier KB**: When available — Zap templates
- **LinkedIn Strategy**: `~/Claude/projetos/linkedin-strategy/` — Recruitment automation

---

## 📝 Document Maintenance

### Version History
- **v1.0** (25/03/2026): Initial comprehensive research
  - 4 documents created
  - 2,500+ lines of content
  - All major topics covered
  - Real-world integration examples

### Quality Checklist
- ✅ All official documentation reviewed
- ✅ API endpoints verified (developers.gupy.io)
- ✅ Webhook events tested
- ✅ Integration flows documented
- ✅ Code examples provided
- ✅ Error scenarios covered
- ✅ Security best practices included
- ✅ Pricing confirmed (Q1 2026)

### Update Frequency
- **API Changes**: Monitor https://developers.gupy.io for updates
- **Feature Releases**: Check Gupy blog quarterly
- **Integrations**: Test annually with latest SDKs

---

## 🤝 Contributing

To update/enhance this KB:
1. Check if official Gupy docs changed (https://developers.gupy.io)
2. Test endpoints with current API version
3. Update relevant document
4. Maintain version numbering
5. Update this INDEX.md

---

## 📞 Official Resources

**Gupy**:
- Portal: https://www.gupy.io
- Developers: https://developers.gupy.io
- Support: https://suporte.gupy.io
- GitHub: https://github.com/gupy-io
- Blog: https://www.gupy.io/blog

**Integrations**:
- n8n: https://n8n.io
- Zapier: https://zapier.com
- Make.com: https://www.make.com
- Digibee: https://www.digibee.com.br
- LinkAPI: https://linkapi.solutions

---

## 📄 License & Usage

This knowledge base is:
- ✅ Internal reference (Raiz/Gupy integration team)
- ✅ Educational use (training, onboarding)
- ⚠️ API credentials NOT included (handle separately in .env)
- ⚠️ Contains public documentation only (no confidential data)

---

**Last Reviewed**: 25/03/2026
**Curator**: Integration & Research Team
**Next Review**: Q2 2026
