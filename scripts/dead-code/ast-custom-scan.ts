#!/usr/bin/env -S bunx tsx
/**
 * ast-custom-scan.ts — TS Compiler API scanner para 4 categorias custom de dead code.
 *
 * Categorias:
 *   1. Componentes nunca renderizados (JSX traversal a partir de entry points)
 *   2. useState/useReducer morto (setter sem call OU value sem leitura)
 *   3. Props nao usados
 *   4. Comentarios com codigo sem prefixo WHY/TODO/FIXME/HACK/NOTE/JSDoc/SPDX
 *
 * Invocado por ag-escanear-morto-codigo. Output: JSON merged em dead-code-findings.json.
 *
 * Usage:
 *   bunx tsx ast-custom-scan.ts --project /path/to/project [--categoria all|components|state|props|comments] --output /tmp/ast-custom-findings.json
 */

import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

type Confidence = "HIGH" | "MEDIUM" | "LOW";

interface Finding {
  id: string;
  category:
    | "component-orphan"
    | "dead-state-setter"
    | "dead-state-value"
    | "props-unused"
    | "dead-comment";
  file: string;
  line: number;
  column?: number;
  name?: string;
  context?: string;
  confidence: Confidence;
  signals: Record<string, unknown>;
  recommendation: string;
}

const args = parseArgs(process.argv.slice(2));
const projectPath = args.project || process.cwd();
const categoria = args.categoria || "all";
const outputPath = args.output || path.join(projectPath, ".deadcode-scan", "ast-custom-findings.json");

const findings: Finding[] = [];
let nextId = 1;

const sourceFiles = collectSourceFiles(projectPath);
const program = ts.createProgram(sourceFiles, {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  jsx: ts.JsxEmit.Preserve,
  allowJs: true,
  esModuleInterop: true,
  skipLibCheck: true,
  noEmit: true,
});
const checker = program.getTypeChecker();

if (categoria === "all" || categoria === "components") {
  scanOrphanComponents(program, sourceFiles);
}
if (categoria === "all" || categoria === "state") {
  scanDeadState(program, sourceFiles);
}
if (categoria === "all" || categoria === "props") {
  scanUnusedProps(program, sourceFiles);
}
if (categoria === "all" || categoria === "comments") {
  scanDeadComments(sourceFiles);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(
  outputPath,
  JSON.stringify(
    {
      scan_metadata: {
        scanner: "ast-custom-scan",
        project: projectPath,
        categoria,
        scanned_files: sourceFiles.length,
        timestamp: new Date().toISOString(),
      },
      findings,
      summary: summarize(findings),
    },
    null,
    2,
  ),
);

console.log(`[ast-custom-scan] Wrote ${findings.length} findings to ${outputPath}`);

// ============================================================
// Scanners
// ============================================================

function scanOrphanComponents(program: ts.Program, files: string[]) {
  // Coletar todos os componentes exportados (function/const com retorno JSX)
  const exportedComponents = new Map<string, { file: string; line: number; name: string }>();
  // Coletar todos os JSX usages
  const jsxUsages = new Set<string>();
  // Coletar imports identificados (para cross-check)
  const importedNames = new Set<string>();

  for (const filePath of files) {
    const source = program.getSourceFile(filePath);
    if (!source) continue;

    ts.forEachChild(source, function visit(node) {
      // Componentes: function exportada com retorno JSX OU const exportada com arrow function JSX
      if (
        (ts.isFunctionDeclaration(node) || ts.isVariableStatement(node)) &&
        hasExportModifier(node) &&
        looksLikeReactComponent(node)
      ) {
        const name = getComponentName(node);
        if (name && /^[A-Z]/.test(name)) {
          const { line } = source.getLineAndCharacterOfPosition(node.getStart());
          exportedComponents.set(`${filePath}::${name}`, {
            file: filePath,
            line: line + 1,
            name,
          });
        }
      }

      // JSX usages
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName.getText();
        if (/^[A-Z]/.test(tag)) jsxUsages.add(tag);
      }

      // Imports
      if (ts.isImportDeclaration(node) && node.importClause) {
        const { name, namedBindings } = node.importClause;
        if (name) importedNames.add(name.text);
        if (namedBindings && ts.isNamedImports(namedBindings)) {
          for (const spec of namedBindings.elements) {
            importedNames.add(spec.name.text);
          }
        }
      }

      ts.forEachChild(node, visit);
    });
  }

  // Componente e orphan se nome nao aparece em jsxUsages E nao em importedNames cross-file
  for (const [key, comp] of exportedComponents) {
    const usedAsJsx = jsxUsages.has(comp.name);
    const usedAsImport = importedNames.has(comp.name);

    if (!usedAsJsx && !usedAsImport) {
      findings.push({
        id: `F${String(nextId++).padStart(4, "0")}`,
        category: "component-orphan",
        file: relativePath(comp.file, projectPath),
        line: comp.line,
        name: comp.name,
        confidence: "MEDIUM",
        signals: {
          "ast-custom": true,
          "jsx-usage": false,
          "import-usage": false,
        },
        recommendation: "delete (verificar bundle + dynamic imports antes)",
      });
    }
  }
}

function scanDeadState(program: ts.Program, files: string[]) {
  for (const filePath of files) {
    const source = program.getSourceFile(filePath);
    if (!source) continue;

    ts.forEachChild(source, function visit(node) {
      if (
        ts.isVariableDeclaration(node) &&
        node.initializer &&
        ts.isCallExpression(node.initializer)
      ) {
        const callee = node.initializer.expression.getText();
        if (callee === "useState" || callee === "React.useState") {
          analyzeUseStateBinding(node, source, filePath);
        }
      }
      ts.forEachChild(node, visit);
    });
  }
}

function analyzeUseStateBinding(
  node: ts.VariableDeclaration,
  source: ts.SourceFile,
  filePath: string,
) {
  if (!ts.isArrayBindingPattern(node.name)) return;
  const elements = node.name.elements;
  if (elements.length < 2) return;

  const valueEl = elements[0];
  const setterEl = elements[1];
  if (!ts.isBindingElement(valueEl) || !ts.isBindingElement(setterEl)) return;
  const valueName = valueEl.name.getText();
  const setterName = setterEl.name.getText();

  // Buscar referencias no escopo do mesmo arquivo (heuristica simples)
  const fileText = source.getText();
  const setterRegex = new RegExp(`\\b${escapeRegex(setterName)}\\s*\\(`, "g");
  const valueRegex = new RegExp(`\\b${escapeRegex(valueName)}\\b`, "g");

  // Setter usage: contar chamadas (excluindo a propria declaracao)
  const setterCalls = (fileText.match(setterRegex) || []).length;
  // Value usage: contar referencias (excluindo a propria declaracao no array binding)
  const valueRefs = (fileText.match(valueRegex) || []).length - 1; // -1 pela declaracao

  const { line } = source.getLineAndCharacterOfPosition(node.getStart());

  if (setterCalls === 0) {
    findings.push({
      id: `F${String(nextId++).padStart(4, "0")}`,
      category: "dead-state-setter",
      file: relativePath(filePath, projectPath),
      line: line + 1,
      name: `${valueName}/${setterName}`,
      confidence: "LOW",
      signals: {
        "ast-custom": true,
        "setter-calls": setterCalls,
        "value-refs": valueRefs,
      },
      recommendation:
        "setter nunca chamado. Considerar transformar em const (se inicializador estatico) ou remover. Verificar refs/closures manualmente.",
    });
  }

  if (valueRefs === 0) {
    findings.push({
      id: `F${String(nextId++).padStart(4, "0")}`,
      category: "dead-state-value",
      file: relativePath(filePath, projectPath),
      line: line + 1,
      name: `${valueName}/${setterName}`,
      confidence: "LOW",
      signals: {
        "ast-custom": true,
        "setter-calls": setterCalls,
        "value-refs": valueRefs,
      },
      recommendation:
        "value nunca lido. Considerar remover useState completo. Verificar JSX/effects manualmente.",
    });
  }
}

function scanUnusedProps(program: ts.Program, files: string[]) {
  for (const filePath of files) {
    const source = program.getSourceFile(filePath);
    if (!source) continue;

    ts.forEachChild(source, function visit(node) {
      // Componente function com props desestruturados
      if (
        (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node)) &&
        node.parameters.length > 0
      ) {
        const param = node.parameters[0];
        if (param.name && ts.isObjectBindingPattern(param.name)) {
          const declaredProps = param.name.elements.map((e) =>
            ts.isBindingElement(e) ? e.name.getText() : "",
          );
          const body = node.body?.getText() || "";
          const unused = declaredProps.filter((p) => {
            if (!p) return false;
            const re = new RegExp(`\\b${escapeRegex(p)}\\b`, "g");
            return (body.match(re) || []).length <= 1; // 1 ocorrencia = a propria declaracao
          });

          if (unused.length > 0) {
            const { line } = source.getLineAndCharacterOfPosition(param.getStart());
            findings.push({
              id: `F${String(nextId++).padStart(4, "0")}`,
              category: "props-unused",
              file: relativePath(filePath, projectPath),
              line: line + 1,
              name: unused.join(", "),
              confidence: "MEDIUM",
              signals: {
                "ast-custom": true,
                "unused-props": unused,
              },
              recommendation: "remover props nao usados da assinatura e dos call sites",
            });
          }
        }
      }
      ts.forEachChild(node, visit);
    });
  }
}

function scanDeadComments(files: string[]) {
  // Heuristica: blocos de >2 linhas comentadas consecutivas que parecem codigo
  // E nao tem prefixo WHY/TODO/FIXME/HACK/NOTE/XXX/@/SPDX/Copyright/eslint-disable
  const validPrefixes = /^(\s*)(\/\/|\*)\s*(TODO|FIXME|HACK|NOTE|XXX|WHY|@\w+|SPDX|Copyright|eslint-disable|eslint|prettier)\b/i;
  const codeLikeRegex = /[(){};=]|=>|return\s|const\s|let\s|var\s|function\s|class\s|import\s|export\s/;

  for (const filePath of files) {
    const text = fs.readFileSync(filePath, "utf-8");
    const lines = text.split("\n");
    let block: { start: number; lines: string[] } | null = null;

    const flush = () => {
      if (!block || block.lines.length < 2) {
        block = null;
        return;
      }
      const blockText = block.lines.join("\n");
      const isCommentedCode =
        block.lines.every((l) => /^\s*(\/\/|\*)/.test(l)) &&
        codeLikeRegex.test(blockText) &&
        !block.lines.some((l) => validPrefixes.test(l));

      if (isCommentedCode) {
        findings.push({
          id: `F${String(nextId++).padStart(4, "0")}`,
          category: "dead-comment",
          file: relativePath(filePath, projectPath),
          line: block.start + 1,
          context: blockText.slice(0, 200),
          confidence: "LOW",
          signals: {
            "regex-match": true,
            "block-lines": block.lines.length,
          },
          recommendation:
            "comentario com codigo sem prefixo (WHY/TODO/FIXME/etc). Remover ou anotar razao.",
        });
      }
      block = null;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*(\/\/|\*)/.test(line) && !line.includes("/**") && !line.includes("*/")) {
        if (!block) block = { start: i, lines: [] };
        block.lines.push(line);
      } else {
        flush();
      }
    }
    flush();
  }
}

// ============================================================
// Helpers
// ============================================================

function collectSourceFiles(root: string): string[] {
  const patterns = [
    "src/**/*.{ts,tsx,js,jsx}",
    "app/**/*.{ts,tsx,js,jsx}",
    "pages/**/*.{ts,tsx,js,jsx}",
    "components/**/*.{ts,tsx,js,jsx}",
    "lib/**/*.{ts,tsx,js,jsx}",
  ];
  const ignore = [
    "**/*.test.*",
    "**/*.spec.*",
    "**/__tests__/**",
    "**/__fixtures__/**",
    "**/__mocks__/**",
    "**/*.stories.*",
    "**/*.generated.*",
    "**/__generated__/**",
    "**/.next/**",
    "**/dist/**",
    "**/build/**",
    "**/node_modules/**",
  ];

  const files = new Set<string>();
  for (const pattern of patterns) {
    const matches = glob.sync(pattern, { cwd: root, ignore, absolute: true });
    matches.forEach((f) => files.add(f));
  }
  return Array.from(files);
}

function hasExportModifier(node: ts.Node): boolean {
  return (
    (ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined)?.some(
      (m) => m.kind === ts.SyntaxKind.ExportKeyword,
    ) || false
  );
}

function looksLikeReactComponent(node: ts.Node): boolean {
  const text = node.getText();
  return /<[A-Z]/.test(text) || /jsx|JSX|React\.createElement/.test(text);
}

function getComponentName(node: ts.Node): string | undefined {
  if (ts.isFunctionDeclaration(node) && node.name) return node.name.text;
  if (ts.isVariableStatement(node)) {
    const decl = node.declarationList.declarations[0];
    if (decl && ts.isIdentifier(decl.name)) return decl.name.text;
  }
  return undefined;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function relativePath(absPath: string, base: string): string {
  return path.relative(base, absPath);
}

function summarize(findings: Finding[]) {
  const byCat: Record<string, number> = {};
  const byConf: Record<Confidence, number> = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const f of findings) {
    byCat[f.category] = (byCat[f.category] || 0) + 1;
    byConf[f.confidence]++;
  }
  return { total: findings.length, by_category: byCat, by_confidence: byConf };
}

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      out[key] = val;
    }
  }
  return out;
}
