import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const controllerDir = join(root, "../Backend/src/main/java/com/example/madar/Controller");
const audit = readFileSync(join(root, "docs/unused-endpoints-audit.md"), "utf8");
const contractsSource = readFileSync(
  join(root, "lib/api/operation-contracts.ts"),
  "utf8",
);

const auditSection = audit
  .split("## قائمة Controllers الكاملة")[1]
  ?.split("## Endpoints غير المستخدمة")[0];
if (!auditSection)
  throw new Error("The controller inventory is missing from the source audit.");

const auditRows = new Map();
for (const line of auditSection.split("\n")) {
  if (!/^\|\s*(GET|POST|PUT|PATCH|DELETE)\s+\|/.test(line)) continue;
  const columns = line
    .split("|")
    .slice(1, -1)
    .map((column) => column.trim());
  if (columns.length < 7 || columns[0] === "Method") continue;
  auditRows.set(`${columns[0]} ${columns[1].replaceAll("`", "")}`, {
    status: columns[5].replaceAll("*", ""),
    evidence: columns[6],
  });
}

const contracts = [];
for (const match of contractsSource.matchAll(
  /\{\s*method:\s*"(GET|POST|PUT|PATCH|DELETE)"\s*,\s*path:\s*"([^"]+)"\s*,\s*access:\s*"(public|private|admin)"/g,
)) {
  contracts.push({ method: match[1], path: match[2], access: match[3] });
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function contractFor(method, path) {
  return contracts.find((contract) => {
    if (contract.method !== method) return false;
    const expression = new RegExp(
      `^${contract.path
        .split("/")
        .map((part) => (/^\{.*\}$/.test(part) ? "[^/]+" : escapeRegex(part)))
        .join("/")}$`,
    );
    return expression.test(path);
  });
}

function endpointSignature(source, mappingMatch, nextMappingIndex) {
  const section = source.slice(mappingMatch.index, nextMappingIndex);
  const publicIndex = section.indexOf("public ");
  if (publicIndex < 0) return null;
  const declaration = section.slice(publicIndex);
  const head = declaration.match(/public\s+([\w.]+(?:<[\w<>, ?]+>)?)\s*(\w+)\s*\(/);
  if (!head) return null;
  const open = declaration.indexOf("(", head.index + head[0].length - 1);
  let depth = 0;
  let close = -1;
  let quoted = false;
  let escaped = false;
  for (let index = open; index < declaration.length; index += 1) {
    const character = declaration[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\" && quoted) {
      escaped = true;
      continue;
    }
    if (character === '"') quoted = !quoted;
    if (quoted) continue;
    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;
    if (depth === 0) {
      close = index;
      break;
    }
  }
  if (close < 0) return null;
  const parameters = declaration.slice(open + 1, close);
  const body = parameters
    .split(/,(?![^()]*\))/)
    .find((parameter) => parameter.includes("@RequestBody"));
  const requestBody = body
    ? body
        .replace(/@\w+(?:\([^)]*\))?/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    : "none";
  const pathVariables = [
    ...parameters.matchAll(/@PathVariable(?:\([^)]*\))?\s+(?:[\w<>?,.\[\]]+\s+)?(\w+)/g),
  ].map((match) => match[1]);
  const queryParameters = [
    ...parameters.matchAll(/@RequestParam(?:\([^)]*\))?\s+(?:[\w<>?,.\[\]]+\s+)?(\w+)/g),
  ].map((match) => match[1]);
  const headers = [
    ...parameters.matchAll(/@RequestHeader(?:\([^)]*\))?\s+(?:[\w<>?,.\[\]]+\s+)?(\w+)/g),
  ].map((match) => match[1]);
  return {
    methodName: head[2],
    response: head[1].trim(),
    requestBody,
    pathVariables,
    queryParameters,
    headers,
  };
}

const endpoints = [];
for (const file of readdirSync(controllerDir).filter((name) =>
  name.endsWith("Controller.java"),
)) {
  const source = readFileSync(join(controllerDir, file), "utf8");
  const base = source.match(/@RequestMapping\("([^"]+)"\)/)?.[1];
  if (!base) throw new Error(`${file} is missing a class-level @RequestMapping.`);
  const mappings = [
    ...source.matchAll(
      /@(Get|Post|Put|Patch|Delete)Mapping(?:\("([^"]*)"\))?\s*public\s+/g,
    ),
  ];
  for (let index = 0; index < mappings.length; index += 1) {
    const mapping = mappings[index];
    const method = mapping[1].toUpperCase();
    const path = `${base}${mapping[2] ?? ""}`;
    const signature = endpointSignature(
      source,
      mapping,
      mappings[index + 1]?.index ?? source.length,
    );
    endpoints.push({ method, path, controller: file, signature });
  }
}

if (endpoints.length !== auditRows.size) {
  throw new Error(
    `Controller count (${endpoints.length}) does not match audited inventory (${auditRows.size}).`,
  );
}

const duplicateKeys = endpoints
  .map(({ method, path }) => `${method} ${path}`)
  .filter((key, index, values) => values.indexOf(key) !== index);
if (duplicateKeys.length)
  throw new Error(`Duplicate Spring mappings: ${duplicateKeys.join(", ")}`);

function classify(endpoint, auditRow, contract) {
  if (
    endpoint.path.startsWith("/api/v1/user/admin/") ||
    (endpoint.path.startsWith("/api/v1/credit-packages") &&
      endpoint.path !== "/api/v1/credit-packages/active") ||
    [
      "/api/v1/current-home/get",
      "/api/v1/housing-preference/get",
      "/api/v1/property-comparison/get",
    ].includes(endpoint.path)
  )
    return "ADMIN EXCLUDED";
  if (
    endpoint.path.startsWith("/api/v1/n8n/") ||
    endpoint.path === "/api/v1/payments/webhook"
  )
    return "BACKEND ONLY";
  if (endpoint.path === "/api/v1/auth/refresh") return "BLOCKED";
  if (auditRow?.status === "USED") return "STATICALLY VERIFIED";
  if (auditRow?.status === "PARTIALLY INTEGRATED" && contract)
    return "PARTIALLY INTEGRATED";
  return "UNUSED";
}

function callerFor(endpoint, auditRow, status) {
  if (status === "ADMIN EXCLUDED")
    return "Intentionally excluded (Admin/internal management)";
  if (status === "BACKEND ONLY") return "No browser caller (provider/internal callback)";
  if (status === "BLOCKED")
    return "No caller; refresh is fail-closed before upstream request";
  if (auditRow?.status === "USED") return auditRow.evidence.replaceAll("`", "");
  return auditRow?.evidence?.replaceAll("`", "") ?? "No frontend caller found";
}

function bffFor(endpoint, contract, status) {
  if (status === "ADMIN EXCLUDED") return "Not exposed to browser BFF";
  if (status === "BACKEND ONLY") return "Not applicable";
  if (endpoint.path.startsWith("/api/v1/auth/"))
    return endpoint.path.endsWith("/refresh")
      ? "Dedicated auth Route Handler; responds 503 before Spring refresh"
      : "Dedicated auth Route Handler";
  if (contract) return `Allowlisted ${contract.access} operation`;
  return status === "PARTIALLY INTEGRATED" ? "No browser BFF operation" : "Not exposed";
}

function authFor(endpoint, contract, status) {
  if (status === "ADMIN EXCLUDED") return "Admin-only or administrative data";
  if (status === "BACKEND ONLY")
    return endpoint.path === "/api/v1/payments/webhook"
      ? "Provider webhook signature"
      : "Internal API key";
  if (endpoint.path.startsWith("/api/v1/auth/"))
    return "Public auth operation; session cookie handled server-side";
  if (contract?.access === "public") return "Public";
  if (endpoint.path.startsWith("/api/v1/moving-checklist/"))
    return "Authenticated USER role";
  return "Authenticated Bearer JWT; personal identity derived by Spring";
}

function testResult(endpoint, status) {
  if (status === "ADMIN EXCLUDED" || status === "BACKEND ONLY" || status === "UNUSED")
    return "Not invoked; exclusion/non-consumer is intentional";
  if (status === "BLOCKED")
    return "Static safety tests pass; rotation/concurrency NOT VERIFIED";
  if (endpoint.path.startsWith("/api/v1/moving-checklist/"))
    return "Static BFF/CSRF test passes; runtime not tested";
  if (endpoint.path === "/api/v1/recommendations/me/smart")
    return "Static paid-confirmation/retry-safety test passes; runtime not tested";
  if (
    endpoint.path.includes("/compare-two/") ||
    endpoint.path.includes("/compare-multiple/")
  )
    return "Static request-path/CSRF test passes; runtime not tested";
  return "Static inventory/call-chain review; endpoint-specific runtime test not run";
}

const escapeCell = (value) =>
  String(value ?? "—")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ");
const rows = endpoints.map((endpoint) => {
  const key = `${endpoint.method} ${endpoint.path}`;
  const auditRow = auditRows.get(key);
  const contract = contractFor(endpoint.method, endpoint.path);
  const status = classify(endpoint, auditRow, contract);
  const signature = endpoint.signature;
  const dto = signature
    ? `${signature.methodName}; body: ${signature.requestBody}; path: ${signature.pathVariables.join(", ") || "—"}; query: ${signature.queryParameters.join(", ") || "—"}; response: ${signature.response}`
    : "See controller method signature; automatic signature extraction unavailable";
  return `| ${endpoint.method} | \`${endpoint.path}\` | ${escapeCell(callerFor(endpoint, auditRow, status))} | ${escapeCell(bffFor(endpoint, contract, status))} | ${escapeCell(authFor(endpoint, contract, status))} | ${escapeCell(dto)} | ${escapeCell(testResult(endpoint, status))} | **${status}** |`;
});

const counts = new Map();
for (const endpoint of endpoints) {
  const key = `${endpoint.method} ${endpoint.path}`;
  const status = classify(
    endpoint,
    auditRows.get(key),
    contractFor(endpoint.method, endpoint.path),
  );
  counts.set(status, (counts.get(status) ?? 0) + 1);
}

const document =
  `# MADAR Backend Endpoint Verification\n\n` +
  `Generated from current Spring controller mappings and the frontend audit on 2026-10-28.\n\n` +
  `## Scope and result\n\n` +
  `- Discovered **${endpoints.length}** controller mappings across ${readdirSync(controllerDir).filter((name) => name.endsWith("Controller.java")).length} controllers. No duplicate HTTP method/path pairs were found.\n` +
  `- Status counts: ${[...counts].map(([status, count]) => `${status} ${count}`).join("; ")}.\n` +
  `- No endpoint is marked VERIFIED: no live backend endpoint calls were made. STATICALLY VERIFIED means a frontend caller and static contract path were traced, not a successful runtime response.\n` +
  `- The full endpoint inventory and original caller evidence are in [unused-endpoints-audit.md](./unused-endpoints-audit.md).\n\n` +
  `## Shared BFF/auth findings\n\n` +
  `- Business routes are allowlisted in \`lib/api/operation-contracts.ts\`; private routes require a server-read session and forward the access token as Bearer authorization through \`lib/api/backend.server.ts\`. Actor IDs are not accepted as query identity.\n` +
  `- Browser mutations require Origin/CSRF validation. The BFF also requires CSRF for payment verification, commute analysis, and credit-consuming comparison GET routes. Query allowlists and duplicate-parameter checks run before forwarding.\n` +
  `- The BFF preserves upstream HTTP status and reviewed backend messages, rejects malformed successful JSON, and maps upstream timeouts/network errors to 504/503. The browser client has a 60-second timeout.\n` +
  `- Auth cookies are encrypted, HttpOnly, Secure in production, SameSite=Lax, and written only in Route Handlers. Refresh is intentionally fail-closed with HTTP 503 before calling Spring because safe durable cross-instance rotation coordination is unavailable. Concurrent refresh safety, token rotation, and stale-cookie races are therefore NOT VERIFIED.\n` +
  `- Backend security configuration disables Spring CSRF (JWT stateless API); browser CSRF here protects the Next.js BFF boundary. Backend authorization is separately enforced by Spring security.\n\n` +
  `## Findings and fixes\n\n` +
  `- **Fixed: paid smart recommendations lacked a price/confirmation gate.** Spring reserves \`TOP_3_RECOMMENDATIONS\` for \`POST /api/v1/recommendations/me/smart\` (\`RecommendationService.java:78-98\`). The UI now reads the current price and balance, requires an explicit confirmation, disables duplicate submission, sets mutation retry to zero, and invalidates wallet data after settlement (\`features/recommendations/smart-recommendations.tsx:50-82, 100, 241-260\`). A static safety test was added. No request was executed.\n` +
  `- **Blocked: refresh rotation cannot be safely enabled in this frontend deployment.** Expected: one successful Spring \`POST /api/v1/auth/refresh\` per refresh token. Actual: Next returns 503 before Spring is called (\`app/api/auth/[operation]/route.ts:46-48\`; \`lib/auth/refresh-policy.server.ts:4-15\`). Spring consumes tokens and revokes the entire family on replay (\`RefreshTokenService.java:58-74\`), while this stateless frontend has no shared atomic coordinator/idempotent recovery contract. No frontend-only fix can guarantee cross-instance single-flight or prevent stale cookie writes. Required: backend idempotent rotation recovery or an approved durable coordinator with atomic session generation/CAS and stale-response protection. Existing token session expires with the access token; refresh and multi-tab/multi-instance behavior are NOT VERIFIED.\n` +
  `- **Partially integrated: six legacy path-based search endpoints** are still in the BFF allowlist without a page/hook caller; the active search uses the query-based \`/api/v1/properties/search\` contract. No user-facing failure is established. Recommended follow-up: remove these legacy allowlist operations if no consumer is planned, or add a real product use case and tests.\n\n` +
  `## Credit and external-provider safety\n\n` +
  `- Backend credit reservations were found in AI chat, smart recommendations, selected-neighborhood recommendations, commute reports, and one-/multi-home comparisons. The paid frontend paths are explicit actions, use live service-price/balance reads where implemented, and use mutation retry zero; smart recommendations received the missing confirmation gate during this audit.\n` +
  `- Google Places/Routes, Kite, OpenRouter, and Moyasar integrations were identified from backend clients/services. No live calls to these providers, payment creation, paid comparison, commute, or recommendation endpoints were made. The generated matrix notes focused tests where available; other response behavior remains static-only.\n\n` +
  `## Coverage limitations and backend-only checks\n\n` +
  `- No real authentication, destructive account operation, payment, credit consumption, Google Routes/Places, Kite, or OpenRouter request was executed.\n` +
  `- Per-endpoint runtime/UI tests are not present for most existing integrations; entries state the actual static or focused test evidence.\n` +
  `- Backend compilation/tests were not run because the Backend tree is read-only for this task; executing Maven would write build artifacts there. Static controller/security inspection found no duplicate HTTP method/path mappings.\n\n` +
  `## Endpoint matrix\n\n` +
  `| Method | Endpoint | Frontend Caller | BFF | Auth | DTO (controller method; request/path/query/response) | Test Result | Status |\n` +
  `|---|---|---|---|---|---|---|---|\n` +
  rows.join("\n") +
  "\n";

writeFileSync(join(root, "docs/api-endpoint-verification.md"), document);
console.log(`Wrote docs/api-endpoint-verification.md for ${endpoints.length} mappings.`);
console.log([...counts].map(([status, count]) => `${status}: ${count}`).join("\n"));
