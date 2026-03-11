# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-03-11

### Changed
- **Commands eliminated**: All 50 command files removed (were 1-line wrappers duplicating skills)
  - Agents now invoked exclusively via skills: `/ag-L-NN-nome` -> Skill tool -> SKILL.md
  - `commands/` directory is empty
- **22 skills enriched** with Quality Gate, Anti-Patterns, and Output sections:
  - 10 critical skills (full QG+AP+Output): ag-B-08, ag-B-09, ag-Q-13, ag-Q-14, ag-Q-15, ag-D-18, ag-D-19, ag-P-04, ag-P-07, ag-W-21
  - 12 additional skills (Output section): ag-B-10, ag-B-11, ag-B-24, ag-D-20, ag-D-27, ag-I-32, ag-I-33, ag-I-34, ag-I-35, ag-M-28, ag-P-05, ag-W-30
- **ag-Q-13-testar-codigo** expanded from 61L to 128L with comprehensive test patterns:
  - Test type table (Unit, Integration, Smoke, Error boundary, Access control)
  - Template per function with minimum expects
  - Theatrical detection grep commands
  - Operation modes (--from-spec TDD, pos-implementacao Green)
  - Agent interaction matrix
- **ag-M-00 orchestrator catalog** updated: 48 skills | 0 commands
  - Added ui-ux-pro-max and ag_skill-creator to Table 1.2
  - Legend updated with `fork=context isolado`

### Added
- 36 new skill directories (from 20 to 56 total)
- e2e-batch skill for batch E2E test execution
- ag-Q-37-gerar-testes-mcp skill

### Removed
- 50 command wrapper files (ag-B-*.md, ag-D-*.md, ag-I-*.md, ag-M-*.md, ag-P-*.md, ag-Q-*.md, ag-W-*.md, ag-X-*.md, ag_skill-creator.md)

## [2.0.0] - 2026-03-11

### Changed
- **BREAKING**: Agent naming convention migrated to `ag-L-NN-nome` where L = category letter
  - P = Planning (ag-P-01 through ag-P-07)
  - B = Build (ag-B-08 through ag-B-26)
  - Q = Quality (ag-Q-12 through ag-Q-45)
  - D = Deploy (ag-D-17 through ag-D-38)
  - W = Writing (ag-W-21, ag-W-29 through ag-W-31)
  - I = Integration (ag-I-32 through ag-I-35)
  - M = Meta (ag-M-00, ag-M-28, ag-M-47, ag-M-99)
  - X = External (ag-X-46)
- All 46 agent files renamed with category prefix
- All 50 command files updated with new agent references
- All 20 skill directories renamed with category prefix
- All documentation updated to new naming convention
- install.sh updated with new agent names in all tiers

### Added
- 9 new agents since v1.0.0:
  - ag-Q-39 (ciclo-teste-completo), ag-Q-40 (testar-qualidade), ag-Q-41 (criar-cenario-qat)
  - ag-Q-42 (testar-ux-qualidade), ag-Q-43 (criar-cenario-ux-qat)
  - ag-Q-44 (benchmark-qualidade), ag-Q-45 (criar-cenario-benchmark)
  - ag-X-46 (buscar-voos), ag-M-47 (criar-agente)
- 6 new QAT/UX-QAT/Benchmark skills
- ux-qat-policy.md rule
- 3 new hooks: ux-qat-post-build.sh, ux-qat-pre-deploy.sh, self-improve-check.sh
- agent_registry.json for backward-compatible agent resolution

## [1.0.0] - 2026-03-07

### Added
- 37 Custom Agents covering full development lifecycle
  - Planning: ag-P-03 through ag-P-07
  - Building: ag-B-08 through ag-B-11
  - Quality: ag-Q-12 through ag-Q-16
  - Deploy: ag-D-18 through ag-D-20, ag-D-27
  - E2E Testing: ag-Q-22, ag-Q-36, ag-D-38
  - Bug Fixing: ag-B-23 through ag-B-26
  - Integration: ag-I-32 through ag-I-35
  - Meta: ag-M-00, ag-M-99, ag_skill-creator
- 14 Skills (orchestrator, patterns, testing, meta-improvement)
- 41 Slash Commands (/ag00 through /ag38, /agM, /ag_skill-creator)
- 29 Governance Rules
- 13 Shell Hooks (5 safety + 8 quality)
- 11 Strategic Playbooks (SDD, Security, QA, Incorporation, etc.)
- Model routing (haiku/sonnet/opus per agent)
- Agent Teams support for parallel execution
- Task tracking in 9 agents
- Worktree isolation for 5 build/refactor agents
- Self-improvement pipeline (ag-M-99 + ag_skill-creator)
- Install script with 3 tiers (starter/standard/full)
- Framework validation script
- GitHub Actions CI
