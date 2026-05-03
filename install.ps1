# Gusman Claude Agent System — Installer (Windows PowerShell)
#
# One-line install:
#   irm https://raw.githubusercontent.com/andregusman-raiz/a-gusman-claude/main/install.ps1 | iex
#
# What it does:
#   1. Pre-flights deps (git, node>=20, gh, Claude Code CLI). Auto-installs via winget.
#   2. Clones the repo to %USERPROFILE%\.gusman-claude\
#   3. Junctions agents/skills/rules/hooks/shared into %USERPROFILE%\.claude\
#      (junctions don't require admin or Developer Mode)
#   4. Installs auto-update hook (pulls latest on session start, ~1h throttle)
#
# Your .claude\ keeps YOUR settings.local.json, projects\, memory — untouched.
#
# Options:
#   -NoAutoUpdate   Skip auto-update hook
#   -SkipDeps       Skip dependency pre-flight
#   -Yes            Don't ask before installing deps
#   -Dest <path>    Custom .claude path (default: $HOME\.claude)
#   -Uninstall      Remove junctions and repo

[CmdletBinding()]
param(
  [switch]$NoAutoUpdate,
  [switch]$SkipDeps,
  [switch]$Yes,
  [string]$Dest = (Join-Path $HOME ".claude"),
  [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'
$RepoUrl  = "https://github.com/andregusman-raiz/a-gusman-claude.git"
$RepoDir  = Join-Path $HOME ".gusman-claude"

function Log  ($m) { Write-Host "[install] $m" -ForegroundColor Blue }
function Ok   ($m) { Write-Host "  ✓ $m" -ForegroundColor Green }
function Warn ($m) { Write-Host "  ! $m" -ForegroundColor Yellow }
function Err  ($m) { Write-Host "  ✗ $m" -ForegroundColor Red }

function Test-Cmd($name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

# ── Uninstall ──────────────────────────────────────────────────────────────────
if ($Uninstall) {
  Log "Uninstalling Gusman Claude Agent System..."
  $links = @('agents','skills','rules','hooks','Playbooks','scripts','shared')
  foreach ($item in $links) {
    $target = Join-Path $Dest $item
    if (Test-Path $target) {
      $info = Get-Item $target -Force -ErrorAction SilentlyContinue
      if ($info -and $info.LinkType) {
        Remove-Item $target -Force -Recurse:$false
        Ok "removed junction: $target"
      }
    }
  }
  $hooksJson = Join-Path $Dest "hooks.json"
  if ((Test-Path $hooksJson) -and ((Get-Item $hooksJson -Force).LinkType)) {
    Remove-Item $hooksJson -Force
    Ok "removed link: hooks.json"
  }
  if (Test-Path $RepoDir) {
    Remove-Item $RepoDir -Recurse -Force
    Ok "removed repo: $RepoDir"
  }
  Write-Host "Uninstall complete. Your settings.local.json, projects\, and memory\ were preserved." -ForegroundColor Green
  exit 0
}

# ── Detect winget ─────────────────────────────────────────────────────────────
function Ensure-Winget {
  if (Test-Cmd 'winget') { return }
  Err "winget is required but not found."
  Err "Install 'App Installer' from the Microsoft Store, or upgrade to Windows 10 1809+."
  Err "Then re-run this installer."
  exit 1
}

# ── Dependency check + install ────────────────────────────────────────────────
function Get-NodeMajor {
  if (-not (Test-Cmd 'node')) { return 0 }
  try {
    $v = (& node -p "process.versions.node.split('.')[0]") 2>$null
    return [int]$v
  } catch { return 0 }
}

function Install-Deps {
  $needed = @()
  if (-not (Test-Cmd 'git'))  { $needed += 'git' }
  if (-not (Test-Cmd 'gh'))   { $needed += 'gh' }
  $nodeMajor = Get-NodeMajor
  if ($nodeMajor -lt 20)      { $needed += 'node' }

  if ($needed.Count -eq 0) {
    Ok "all dependencies present"
    return
  }

  Log ("Missing dependencies: " + ($needed -join ', '))

  if (-not $Yes) {
    $ans = Read-Host "Install them now? [Y/n]"
    if ($ans -and $ans -notmatch '^[Yy]') {
      Err "Aborted by user. Re-run with -SkipDeps to install only the framework."
      exit 1
    }
  }

  Ensure-Winget

  $map = @{
    'git'  = 'Git.Git'
    'gh'   = 'GitHub.cli'
    'node' = 'OpenJS.NodeJS.LTS'
  }

  foreach ($d in $needed) {
    $pkg = $map[$d]
    Log "winget install $pkg"
    winget install --id $pkg --silent --accept-package-agreements --accept-source-agreements
  }

  # refresh PATH for current session
  $env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' +
              [System.Environment]::GetEnvironmentVariable('Path','User')
}

function Install-ClaudeCodeIfMissing {
  if (Test-Cmd 'claude') {
    try { Ok ("Claude Code CLI: " + (& claude --version 2>$null | Select-Object -First 1)) } catch { Ok "Claude Code CLI: installed" }
    return
  }
  if (-not (Test-Cmd 'npm')) {
    Err "npm not found — cannot install Claude Code CLI. Install Node.js first."
    exit 1
  }
  Log "Installing Claude Code CLI globally..."
  npm install -g '@anthropic-ai/claude-code'
  Ok "Claude Code CLI installed"
}

# ── Junction helper (works without admin) ─────────────────────────────────────
function New-Junction($Source, $Target) {
  if (Test-Path $Target) {
    $info = Get-Item $Target -Force -ErrorAction SilentlyContinue
    if ($info.LinkType -eq 'Junction' -or $info.LinkType -eq 'SymbolicLink') {
      Remove-Item $Target -Force -Recurse:$false
    } else {
      Warn "skipped: $Target (exists, not a junction — rename to .bak to use repo version)"
      return $false
    }
  }
  $null = cmd /c mklink /J "`"$Target`"" "`"$Source`"" 2>$null
  if ($LASTEXITCODE -ne 0) {
    Err "junction failed: $Target -> $Source"
    return $false
  }
  return $true
}

# ── Install ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Gusman Claude Agent System — Installer (Windows)" -ForegroundColor Blue
Write-Host ""

Log "Detected OS: Windows"

if ($SkipDeps) {
  Log "Skipping dependency pre-flight (-SkipDeps)"
} else {
  Log "Checking dependencies..."
  Install-Deps
  Install-ClaudeCodeIfMissing
}

# Step 1: Clone or update
Log "[1/4] Setting up repo at $RepoDir"
if (Test-Path (Join-Path $RepoDir ".git")) {
  Push-Location $RepoDir
  git pull --ff-only origin main *>$null
  Pop-Location
  Ok "repo updated"
} else {
  git clone --depth 1 $RepoUrl $RepoDir
  Ok "repo cloned"
}

# Step 2: Ensure dest exists
Log "[2/4] Setting up $Dest"
New-Item -ItemType Directory -Force -Path $Dest | Out-Null

# Step 3: Junctions
Log "[3/4] Linking components"
$linked = 0; $skipped = 0
$items = @('agents','skills','rules','hooks','Playbooks','scripts','shared')
foreach ($item in $items) {
  $src = Join-Path $RepoDir $item
  if (-not (Test-Path $src)) { continue }
  $target = Join-Path $Dest $item
  if (New-Junction $src $target) {
    Ok "linked:  $item\ -> repo"
    $linked++
  } else {
    $skipped++
  }
}

# hooks.json (single file — copy instead of junction; junctions are dirs only)
$hooksSrc = Join-Path $RepoDir "hooks.json"
$hooksDst = Join-Path $Dest "hooks.json"
if (Test-Path $hooksSrc) {
  if (Test-Path $hooksDst) {
    $info = Get-Item $hooksDst -Force -ErrorAction SilentlyContinue
    if ($info.LinkType) { Remove-Item $hooksDst -Force }
  }
  if (-not (Test-Path $hooksDst)) {
    # symbolic link to file (requires Developer Mode OR copy fallback)
    try {
      $null = New-Item -ItemType SymbolicLink -Path $hooksDst -Target $hooksSrc -ErrorAction Stop
      Ok "linked:  hooks.json -> repo"
    } catch {
      Copy-Item $hooksSrc $hooksDst -Force
      Warn "hooks.json copied (not linked — Developer Mode required for file symlinks)"
    }
  }
}

Write-Host "  $linked linked, $skipped skipped"

# Step 4: Auto-update hook
if (-not $NoAutoUpdate) {
  Log "[4/4] Installing auto-update hook"
  $hookPath = Join-Path $RepoDir "hooks\auto-update.ps1"
  $hookDir  = Split-Path $hookPath -Parent
  New-Item -ItemType Directory -Force -Path $hookDir | Out-Null

  $hookContent = @'
# Auto-update hook — runs on Claude Code SessionStart
# Pulls latest from a-gusman-claude repo silently. Throttled to 1h.

$RepoDir = Join-Path $HOME ".gusman-claude"
if (-not (Test-Path (Join-Path $RepoDir ".git"))) { exit 0 }

$Marker = Join-Path $RepoDir ".last-pull"
$Now = [int](Get-Date -UFormat %s)
if (Test-Path $Marker) {
  $Last = [int](Get-Content $Marker -ErrorAction SilentlyContinue)
  if (($Now - $Last) -lt 3600) { exit 0 }
}

Start-Job -ScriptBlock {
  param($d)
  Push-Location $d
  git pull --ff-only origin main *>$null
  Pop-Location
} -ArgumentList $RepoDir | Out-Null

Set-Content -Path $Marker -Value $Now
exit 0
'@

  Set-Content -Path $hookPath -Value $hookContent -Encoding UTF8
  Ok "auto-update hook installed (~1h throttle)"
} else {
  Log "[4/4] Skipped auto-update hook (-NoAutoUpdate)"
}

# ── Summary ────────────────────────────────────────────────────────────────────
$agents = (Get-ChildItem (Join-Path $RepoDir 'agents') -Filter *.md -ErrorAction SilentlyContinue).Count
$skills = (Get-ChildItem (Join-Path $RepoDir 'skills') -Directory -ErrorAction SilentlyContinue).Count
$rules  = (Get-ChildItem (Join-Path $RepoDir 'rules') -Filter *.md -ErrorAction SilentlyContinue).Count
$pats   = (Get-ChildItem (Join-Path $RepoDir 'shared\patterns') -Filter *.md -ErrorAction SilentlyContinue).Count

Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  $agents agents  $skills skills  $rules rules  $pats patterns"
Write-Host ""
Write-Host "  Repo:       $RepoDir"
Write-Host "  Junctioned: $Dest\{agents,skills,rules,hooks,shared,...}"
if (-not $NoAutoUpdate) { Write-Host "  Auto-update: ON (pulls latest every ~1h)" -ForegroundColor Green }
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Start Claude Code: claude"
Write-Host "  2. Try: /ag-0-orquestrador analyze this project"
Write-Host ""
Write-Host "Optional — authenticate MCPs:"
Write-Host "  gh auth login"
Write-Host "  claude mcp list"
Write-Host ""
Write-Host "Files that are YOURS (never overwritten): $Dest\settings.local.json, $Dest\projects\, CLAUDE.md"
Write-Host ""
Write-Host "Update manually:  cd $RepoDir && git pull"
Write-Host "Uninstall:        powershell -File $RepoDir\install.ps1 -Uninstall"
Write-Host ""
Write-Host "Docs: https://github.com/andregusman-raiz/a-gusman-claude"
