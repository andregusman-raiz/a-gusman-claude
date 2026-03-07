# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-07

### Added
- 37 Custom Agents covering full development lifecycle
  - Discovery: ag-03, ag-04, ag-05
  - Planning: ag-06, ag-07
  - Building: ag-08, ag-09, ag-10, ag-11
  - Validation: ag-12, ag-13, ag-14, ag-15
  - Deploy: ag-18, ag-19, ag-20, ag-27
  - E2E Testing: ag-22, ag-36, ag-38
  - Bug Fixing: ag-23, ag-24, ag-25, ag-26
  - Incorporation: ag-32, ag-33, ag-34, ag-35
  - Meta: ag-00, ag-M, ag_skill-creator
- 14 Skills (orchestrator, patterns, testing, meta-improvement)
- 41 Slash Commands (/ag00 through /ag38, /agM, /ag_skill-creator)
- 29 Governance Rules
- 13 Shell Hooks (5 safety + 8 quality)
- 11 Strategic Playbooks (SDD, Security, QA, Incorporation, etc.)
- Model routing (haiku/sonnet/opus per agent)
- Agent Teams support for parallel execution
- Task tracking in 9 agents
- Worktree isolation for 5 build/refactor agents
- Self-improvement pipeline (ag-M + ag_skill-creator)
- Install script with 3 tiers (starter/standard/full)
- Framework validation script
- GitHub Actions CI
