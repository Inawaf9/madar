import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readJson(file, issues) {
  const sourceText = fs.readFileSync(file, "utf8");
  const source = ts.parseJsonText(file, sourceText);

  for (const diagnostic of source.parseDiagnostics) {
    issues.push(
      `${file}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`,
    );
  }

  function checkDuplicates(node, trail = []) {
    if (!ts.isObjectLiteralExpression(node)) return;
    const seen = new Set();
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property) || !ts.isStringLiteral(property.name))
        continue;
      const key = property.name.text;
      const location = [...trail, key];
      if (seen.has(key)) issues.push(`${file}: duplicate key ${location.join(".")}`);
      seen.add(key);
      checkDuplicates(property.initializer, location);
    }
  }

  const expression = source.statements[0]?.expression;
  if (expression) checkDuplicates(expression);
  return JSON.parse(sourceText);
}

function readLocale(locale, issues) {
  const directory = path.join(projectRoot, "messages", locale);
  const index = fs.readFileSync(path.join(directory, "index.ts"), "utf8");
  const imports = new Map(
    [...index.matchAll(/^import (\w+) from "\.\/([\w-]+)\.json";/gm)].map(
      ([, variable, filename]) => [variable, filename],
    ),
  );
  const messages = {};
  const usedFiles = new Set();

  for (const [, namespace, variable] of index.matchAll(/^  (\w+): (\w+),$/gm)) {
    if (Object.hasOwn(messages, namespace))
      issues.push(`${locale}: duplicate namespace ${namespace}`);
    const filename = imports.get(variable);
    if (!filename) {
      issues.push(`${locale}: missing import for ${namespace}`);
      continue;
    }
    const file = `${filename}.json`;
    if (usedFiles.has(file)) issues.push(`${locale}: reused source ${file}`);
    usedFiles.add(file);
    messages[namespace] = readJson(path.join(directory, file), issues);
  }

  for (const file of fs.readdirSync(directory).filter((name) => name.endsWith(".json"))) {
    if (!usedFiles.has(file)) issues.push(`${locale}: uncomposed source ${file}`);
  }

  return messages;
}

function leaves(value, prefix = "", output = new Map()) {
  for (const [key, item] of Object.entries(value)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (item !== null && typeof item === "object" && !Array.isArray(item)) {
      leaves(item, fullKey, output);
    } else {
      output.set(fullKey, item);
    }
  }
  return output;
}

function placeholders(value) {
  if (typeof value !== "string") return [];
  const argumentsUsed = [...value.matchAll(/\{\s*([A-Za-z_]\w*)/g)].map(
    (match) => match[1],
  );
  const richTags = [...value.matchAll(/<\/?([A-Za-z][\w-]*)>/g)].map((match) => match[1]);
  return [...new Set([...argumentsUsed, ...richTags])].sort();
}

export function checkTranslationSources() {
  const issues = [];
  const arabic = leaves(readLocale("ar", issues));
  const english = leaves(readLocale("en", issues));

  for (const [key, value] of arabic) {
    if (!english.has(key)) {
      issues.push(`en: missing ${key}`);
      continue;
    }
    const other = english.get(key);
    if (typeof value !== typeof other) issues.push(`${key}: value types differ`);
    if (placeholders(value).join() !== placeholders(other).join()) {
      issues.push(`${key}: interpolation or rich-text tags differ`);
    }
  }
  for (const key of english.keys()) {
    if (!arabic.has(key)) issues.push(`ar: missing ${key}`);
  }

  const locationDirectory = path.join(projectRoot, "features", "locations", "messages");
  const arabicLocations = leaves(
    readJson(path.join(locationDirectory, "ar.json"), issues),
  );
  const englishLocations = leaves(
    readJson(path.join(locationDirectory, "en.json"), issues),
  );
  for (const [key, value] of arabicLocations) {
    if (!englishLocations.has(key)) {
      issues.push(`locations/en: missing ${key}`);
      continue;
    }
    const other = englishLocations.get(key);
    if (typeof value !== typeof other)
      issues.push(`locations.${key}: value types differ`);
    if (placeholders(value).join() !== placeholders(other).join()) {
      issues.push(`locations.${key}: interpolation or rich-text tags differ`);
    }
  }
  for (const key of englishLocations.keys()) {
    if (!arabicLocations.has(key)) issues.push(`locations/ar: missing ${key}`);
  }

  return { issues, keyCount: arabic.size, locationKeyCount: arabicLocations.size };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const result = checkTranslationSources();
  if (result.issues.length) {
    for (const issue of result.issues) console.error(issue);
    process.exitCode = 1;
  } else {
    console.log(
      `Arabic and English match across ${result.keyCount} main keys and ${result.locationKeyCount} location keys.`,
    );
  }
}
