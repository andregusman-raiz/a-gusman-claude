# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-07

### Added
- 37 Custom Agents covering full development lifecycle
  - Discovery: ag-P-03, ag-P-04, ag-P-05
  - Planning: ag-P-06, ag-P-07
  - Building: ag-B-08, ag-B-09, ag-B-10, ag-B-11
  - Validation: ag-Q-12, ag-Q-13, ag-Q-14, ag-Q-15
  - Deploy: ag-D-18, ag-D-19, ag-D-20, ag-D-27
  - E2E Testing: ag-Q-22, ag-Q-36, ag-D-38
  - Bug Fixing: ag-B-23, ag-B-24, ag-B-25, ag-B-26
  - Incorporation: ag-I-32, ag-I-33, ag-I-34, ag-I-35
  - Meta: ag-M-00, ag-M-99, ag-M-49-criar-skill
- 14 Skills (orchestrator, patterns, testing, meta-improvement)
- 41 Slash Commands (/ag-M-00 through /ag-D-38, /agM, /ag-M-49-criar-skill)
- 29 Governance Rules
- 13 Shell Hooks (5 safety + 8 quality)
- 11 Strategic Playbooks (SDD, Security, QA, Incorporation, etc.)
- Model routing (haiku/sonnet/opus per agent)
- Agent Teams support for parallel execution
- Task tracking in 9 agents
- Worktree isolation for 5 build/refactor agents
- Self-improvement pipeline (ag-M-99 + ag-M-49-criar-skill)
- Install script with 3 tiers (starter/standard/full)
- Framework validation script
- GitHub Actions CI
