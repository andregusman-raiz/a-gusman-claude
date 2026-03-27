---
name: changelog-gen
description: "Gerar CHANGELOG.md automatico a partir de commits e PRs entre tags/releases. Formato Keep a Changelog. Trigger quando usuario quer changelog, release notes, ou historico de mudancas."
model: sonnet
argument-hint: "[generate|update] [from-tag] [to-tag]"
metadata:
  filePattern: "CHANGELOG.md,HISTORY.md,RELEASES.md"
  bashPattern: "changelog|release.notes|historico"
  priority: 70
---

# Changelog Gen Skill

Gerar changelogs automaticos a partir de git history, commits convencionais e PRs.

## Format: Keep a Changelog

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New feature X for doing Y

### Changed
- Updated dependency Z to v2.0

### Deprecated
- Old API endpoint /v1/foo (use /v2/foo instead)

### Removed
- Dropped support for Node 16

### Fixed
- Bug where login failed with special characters (#123)

### Security
- Updated jwt library to patch CVE-2026-XXXX

## [1.2.0] - 2026-03-26

### Added
- Feature A (#100)
- Feature B (#101)

### Fixed
- Bug C (#102)

## [1.1.0] - 2026-03-15

### Added
- Initial release

[Unreleased]: https://github.com/owner/repo/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/owner/repo/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/owner/repo/releases/tag/v1.1.0
```

## Categorias (Conventional Commits -> Changelog)

| Commit Prefix | Changelog Section |
|--------------|-------------------|
| `feat:` | Added |
| `fix:` | Fixed |
| `refactor:` | Changed |
| `perf:` | Changed |
| `docs:` | Changed |
| `deprecate:` | Deprecated |
| `BREAKING CHANGE:` | Changed (com destaque) |
| `security:` | Security |
| `chore:` | (ignorar) |
| `ci:` | (ignorar) |
| `test:` | (ignorar) |

## Git Log Parsing

### Entre tags
```bash
# Commits entre duas tags
git log v1.0.0..v2.0.0 --oneline --no-merges

# Com corpo completo (para breaking changes)
git log v1.0.0..v2.0.0 --format="%H %s%n%b" --no-merges

# Desde ultima tag ate HEAD
LAST_TAG=$(git describe --tags --abbrev=0)
git log ${LAST_TAG}..HEAD --oneline --no-merges

# Todas as tags ordenadas por data
git tag --sort=-creatordate | head -10
```

### Filtrar por tipo
```bash
# Apenas features
git log v1.0.0..HEAD --oneline --no-merges --grep="^feat"

# Apenas fixes
git log v1.0.0..HEAD --oneline --no-merges --grep="^fix"

# Breaking changes
git log v1.0.0..HEAD --format="%H %s%n%b" | grep -B1 "BREAKING CHANGE"
```

## PR-Based Changelog

```bash
# PRs merged desde ultima release
gh pr list --state merged --base master --search "merged:>2026-03-15" --json number,title,labels,mergedAt

# PRs entre tags (by date)
TAG_DATE=$(git log -1 --format=%ai v1.0.0)
gh pr list --state merged --search "merged:>${TAG_DATE}" --json number,title,labels

# Com labels para categorizar
gh pr list --state merged --label "feature" --json number,title
gh pr list --state merged --label "bug" --json number,title
gh pr list --state merged --label "breaking" --json number,title
```

## Script de Geracao

```bash
#!/bin/bash
# generate-changelog.sh
# Usage: ./generate-changelog.sh [from-tag] [to-tag]

FROM_TAG=${1:-$(git describe --tags --abbrev=0)}
TO_TAG=${2:-HEAD}
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

echo "## [${TO_TAG}] - $(date +%Y-%m-%d)"
echo ""

# Added
FEATS=$(git log ${FROM_TAG}..${TO_TAG} --oneline --no-merges --grep="^feat" | sed 's/^[a-f0-9]* feat[:(]/- /' | sed 's/)//')
if [ -n "$FEATS" ]; then
    echo "### Added"
    echo "$FEATS"
    echo ""
fi

# Fixed
FIXES=$(git log ${FROM_TAG}..${TO_TAG} --oneline --no-merges --grep="^fix" | sed 's/^[a-f0-9]* fix[:(]/- /' | sed 's/)//')
if [ -n "$FIXES" ]; then
    echo "### Fixed"
    echo "$FIXES"
    echo ""
fi

# Changed
CHANGES=$(git log ${FROM_TAG}..${TO_TAG} --oneline --no-merges --grep="^refactor\|^perf\|^docs" | sed 's/^[a-f0-9]* [a-z]*[:(]/- /' | sed 's/)//')
if [ -n "$CHANGES" ]; then
    echo "### Changed"
    echo "$CHANGES"
    echo ""
fi

# Breaking Changes
BREAKING=$(git log ${FROM_TAG}..${TO_TAG} --format="%s" | grep -i "BREAKING\|!" | sed 's/^/- **BREAKING**: /')
if [ -n "$BREAKING" ]; then
    echo "### Breaking Changes"
    echo "$BREAKING"
    echo ""
fi
```

## Semantic Versioning Rules

| Change Type | Version Bump | Example |
|------------|-------------|---------|
| Breaking change | MAJOR (X.0.0) | Removed API endpoint |
| New feature (backward compatible) | MINOR (0.X.0) | Added new endpoint |
| Bug fix | PATCH (0.0.X) | Fixed validation |
| Chore/docs/refactor | No bump | Updated README |

### Detectar bump necessario
```bash
# Check if any breaking changes
if git log ${LAST_TAG}..HEAD --format="%s%n%b" | grep -q "BREAKING CHANGE\|!:"; then
    echo "MAJOR bump needed"
elif git log ${LAST_TAG}..HEAD --oneline | grep -q "^.*feat"; then
    echo "MINOR bump needed"
elif git log ${LAST_TAG}..HEAD --oneline | grep -q "^.*fix"; then
    echo "PATCH bump needed"
else
    echo "No version bump needed"
fi
```

## Atualizar CHANGELOG.md Existente

```bash
# 1. Gerar nova secao
NEW_SECTION=$(./generate-changelog.sh v1.1.0 v1.2.0)

# 2. Inserir apos ## [Unreleased] no CHANGELOG.md existente
# Usar Edit tool para inserir a nova secao no lugar certo

# 3. Atualizar links de comparacao no final do arquivo
# [Unreleased]: https://github.com/owner/repo/compare/v1.2.0...HEAD
# [1.2.0]: https://github.com/owner/repo/compare/v1.1.0...v1.2.0
```

## Regras de Uso

1. Formato Keep a Changelog obrigatorio
2. Cada entrada referencia issue/PR quando possivel (#N)
3. Breaking changes em destaque (**BREAKING**)
4. Datas no formato YYYY-MM-DD (ISO 8601)
5. Links de comparacao no final do arquivo
6. Nunca editar entradas de releases anteriores (imutavel)
7. [Unreleased] sempre no topo
