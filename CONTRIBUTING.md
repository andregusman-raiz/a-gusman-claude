# Contributing to Claude Agent System

## How to Add a New Agent

1. Create `agents/ag-XX-your-agent.md` with YAML frontmatter:
   ```yaml
   ---
   name: ag-XX-your-agent
   description: "What it does. Use when [trigger]."
   model: sonnet
   tools: Read, Glob, Grep, Bash
   maxTurns: 40
   ---
   ```

2. Create the corresponding command `commands/agXX.md`:
   ```
   Use the ag-XX-your-agent agent to [action]: $ARGUMENTS
   ```

3. Add the agent to `skills/ag-M-00-orquestrar/SKILL.md` catalog

4. Run validation: `bash scripts/validate-framework.sh`

## How to Add a Skill

1. Create `skills/your-skill/SKILL.md`
2. Follow the SKILL.md format (see existing skills for reference)
3. Add to ag-M-00 catalog if it's a workflow skill

## How to Add a Rule

1. Create `rules/your-rule.md`
2. Keep it focused (one concern per rule)
3. Include: what, why, how, anti-patterns

## How to Add a Hook

1. Create `hooks/your-hook.sh`
2. Make it executable: `chmod +x hooks/your-hook.sh`
3. Register in `hooks.json` under the appropriate event
4. Test: `bash hooks/your-hook.sh`

## Conventions

- Agent names: `ag-XX-verb-noun.md`
- Rule names: `kebab-case.md`
- Hook names: `kebab-case.sh`
- Skill dirs: `kebab-case/SKILL.md`
- Commits: conventional commits (`feat:`, `fix:`, `docs:`)

## Pull Request Checklist

- [ ] `bash scripts/validate-framework.sh` passes
- [ ] No hardcoded project-specific references
- [ ] New agents have corresponding commands
- [ ] YAML frontmatter includes all required fields
- [ ] Description includes "Use when" trigger clause
