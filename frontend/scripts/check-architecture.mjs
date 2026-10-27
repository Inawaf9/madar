import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoots = ["app", "components", "features", "hooks", "i18n", "lib", "messages"];
const forbiddenDirectories = [
  "src",
  "source",
  "client",
  "features/product",
  "components/product",
  "components/property",
  "components/about",
  "components/landing",
  "components/legal",
  "components/site",
];
const issues = [];

for (const directory of forbiddenDirectories) {
  if (fs.existsSync(path.join(root, directory))) {
    issues.push(`Obsolete or alternative source root: ${directory}`);
  }
}

function collect(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(fullPath, files);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(fullPath);
  }
  return files;
}

const files = sourceRoots.flatMap((directory) => collect(path.join(root, directory)));
const fileSet = new Set(files);
const edges = new Map();
const featureEdges = new Map();

function resolveImport(source, specifier) {
  const base = specifier.startsWith("@/")
    ? path.join(root, specifier.slice(2))
    : path.resolve(path.dirname(source), specifier);
  return [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")].find((file) =>
    fileSet.has(file),
  );
}

function checkFeatureBoundary(source, target, specifier) {
  const owner = path.relative(root, source).split(path.sep);
  const dependency = path.relative(root, target).split(path.sep);
  if (
    owner[0] === "features" &&
    dependency[0] === "features" &&
    owner[1] !== dependency[1]
  ) {
    if (!featureEdges.has(owner[1])) featureEdges.set(owner[1], new Set());
    featureEdges.get(owner[1]).add(dependency[1]);
    if (["components", "hooks", "utils"].includes(dependency[2])) {
      issues.push(
        `${path.relative(root, source)} imports private feature code: ${specifier}`,
      );
    }
  }
}

for (const file of files) {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
  );
  const imports = [];
  for (const statement of source.statements) {
    if (
      !(ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) ||
      !statement.moduleSpecifier ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      continue;
    }
    if (ts.isImportDeclaration(statement) && statement.importClause?.isTypeOnly) continue;
    if (ts.isExportDeclaration(statement) && statement.isTypeOnly) continue;
    const specifier = statement.moduleSpecifier.text;
    if (!specifier.startsWith("@/") && !specifier.startsWith(".")) continue;
    const target = resolveImport(file, specifier);
    if (target) {
      imports.push(target);
      checkFeatureBoundary(file, target, specifier);
    }
    if (
      path.relative(root, file).startsWith(`components${path.sep}`) &&
      target &&
      path.relative(root, target).startsWith(`features${path.sep}`)
    ) {
      issues.push(`${path.relative(root, file)} imports feature code: ${specifier}`);
    }
  }
  function visitNode(node) {
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      const specifier = node.arguments[0].text;
      if (specifier.startsWith("@/") || specifier.startsWith(".")) {
        const target = resolveImport(file, specifier);
        if (target) {
          imports.push(target);
          checkFeatureBoundary(file, target, specifier);
        }
      }
    }
    ts.forEachChild(node, visitNode);
  }
  ts.forEachChild(source, visitNode);
  edges.set(file, imports);
}

const active = new Set();
const visited = new Set();
function visit(file, chain) {
  if (active.has(file)) {
    issues.push(
      `Import cycle: ${chain
        .slice(chain.indexOf(file))
        .map((part) => path.relative(root, part))
        .join(" -> ")}`,
    );
    return;
  }
  if (visited.has(file)) return;
  active.add(file);
  for (const imported of edges.get(file) ?? []) visit(imported, [...chain, imported]);
  active.delete(file);
  visited.add(file);
}
for (const file of files) visit(file, [file]);

const activeFeatures = new Set();
const visitedFeatures = new Set();
function visitFeature(feature, chain) {
  if (activeFeatures.has(feature)) {
    issues.push(
      `Feature dependency cycle: ${chain.slice(chain.indexOf(feature)).join(" -> ")}`,
    );
    return;
  }
  if (visitedFeatures.has(feature)) return;
  activeFeatures.add(feature);
  for (const dependency of featureEdges.get(feature) ?? []) {
    visitFeature(dependency, [...chain, dependency]);
  }
  activeFeatures.delete(feature);
  visitedFeatures.add(feature);
}
for (const feature of featureEdges.keys()) visitFeature(feature, [feature]);

if (issues.length) {
  for (const issue of issues) console.error(issue);
  process.exitCode = 1;
} else {
  console.log(
    `Architecture boundaries and import graph passed (${files.length} source files).`,
  );
}
