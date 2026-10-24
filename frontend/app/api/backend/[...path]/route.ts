import { NextResponse, type NextRequest } from "next/server";
import { API_BASE_URL_ENV } from "@/lib/api/config";
import { isUnauthenticatedBackendAccessEnabled } from "@/lib/api/access";

type RouteContext = { params: Promise<{ path: string[] }> };
const allowedRoutes: Record<string, readonly string[]> = {
  "/api/v1/user/register": ["POST"],
  "/api/v1/user/get/:userId": ["GET"],
  "/api/v1/user/update/:userId": ["PUT"],
  "/api/v1/user/delete/:userId": ["DELETE"],
  "/api/v1/current-home/get-by-user/:userId": ["GET"],
  "/api/v1/current-home/add/:userId": ["POST"],
  "/api/v1/current-home/update/:userId/:id": ["PUT"],
  "/api/v1/current-home/delete/:userId/:id": ["DELETE"],
  "/api/v1/housing-preference/get-by-user/:userId": ["GET"],
  "/api/v1/housing-preference/add/:userId": ["POST"],
  "/api/v1/housing-preference/update/:userId/:id": ["PUT"],
  "/api/v1/housing-preference/delete/:userId/:id": ["DELETE"],
  "/api/v1/place-preference/get/:userId": ["GET"],
  "/api/v1/place-preference/add/:userId": ["POST"],
  "/api/v1/place-preference/update/:userId/:id": ["PUT"],
  "/api/v1/place-preference/delete/:userId/:id": ["DELETE"],
  "/api/v1/place-preference/importance/:userId/:id/:importance": ["PATCH"],
  "/api/v1/saved-property/get/:userId": ["GET"],
  "/api/v1/saved-property/add/:userId": ["POST"],
  "/api/v1/saved-property/delete/:userId/:id": ["DELETE"],
  "/api/v1/property-comparison/get-by-user/:userId": ["GET"],
  "/api/v1/property-comparison/get-by-id/:userId/:id": ["GET"],
  "/api/v1/property-comparison/add/:userId": ["POST"],
  "/api/v1/property-comparison/update/:userId/:id": ["PUT"],
  "/api/v1/property-comparison/delete/:userId/:id": ["DELETE"],
};

const publicGetRoutes = [
  /^\/api\/v1\/locations\/cities$/,
  /^\/api\/v1\/locations\/cities\/[a-z_]+\/neighborhoods$/,
  /^\/api\/v1\/properties\/search$/,
  /^\/api\/v1\/properties\/(get|similar)\/[^/]+\/[^/]+$/,
  /^\/api\/v1\/properties\/price-stats\/[^/]+\/(rent|sale)\/[^/]+$/,
  /^\/api\/v1\/place-preference\/nearby-services$/,
];
const scopedRoutes = [
  { method: "GET", path: /^\/api\/v1\/properties\/(match-summary|affordability)\/\d+$/ },
  { method: "GET", path: /^\/api\/v1\/properties\/nearby-interests\/\d+\/[^/]+\/[^/]+$/ },
  { method: "GET", path: /^\/api\/v1\/user\/(profile-completion|dashboard-summary)\/\d+$/ },
  { method: "GET", path: /^\/api\/v1\/current-home\/status\/\d+$/ },
  { method: "GET", path: /^\/api\/v1\/place-preference\/summary\/\d+$/ },
  { method: "GET", path: /^\/api\/v1\/saved-property\/(check|summary)\/\d+$/ },
  { method: "POST", path: /^\/api\/v1\/recommendations\/(match-score|smart)\/\d+$/ },
  { method: "GET", path: /^\/api\/v1\/recommendations\/(neighborhood-suitability|compare-neighborhoods)\/\d+$/ },
  { method: "GET", path: /^\/api\/v1\/property-comparison\/compare-two\/\d+\/[^/]+\/[^/]+\/[^/]+\/[^/]+$/ },
  { method: "GET", path: /^\/api\/v1\/property-comparison\/compare-multiple\/\d+\/\d+(?:(?:,|%2C)\d+){1,3}$/ },
  { method: "GET", path: /^\/api\/v1\/ai\/explain-match\/\d+$/ },
  { method: "POST", path: /^\/api\/v1\/ai\/chat\/\d+$/ },
  { method: "DELETE", path: /^\/api\/v1\/ai\/chat\/\d+$/ },
  { method: "GET", path: /^\/api\/v1\/properties\/(by-preference-in-my-district|within-budget)\/\d+$/ },
  { method: "GET", path: /^\/api\/v1\/properties\/under-budget-margin\/\d+\/\d+$/ },
  { method: "GET", path: /^\/api\/v1\/place-preference\/calculate-commutes\/\d+$/ },
  { method: "POST", path: /^\/api\/v1\/current-home\/\d+\/confirm-move$/ },
  { method: "GET", path: /^\/api\/v1\/current-home\/\d+\/(neighborhood|nearby-by-category|nearest-essential|nearby-search)$/ },
  { method: "POST", path: /^\/api\/v1\/payments\/\d+\/checkout$/ },
  { method: "GET", path: /^\/api\/v1\/payments\/\d+(\/\d+\/verify|\/access\/COMMUTE_REPORT)?$/ },
];
function isAllowed(path: string, method: string): boolean {
  if (method === "GET" && publicGetRoutes.some(route => route.test(path))) return true;
  if (scopedRoutes.some(route => route.method === method && route.path.test(path))) return true;
  return Object.entries(allowedRoutes).some(([route, methods]) => {
    const pattern = route.replace(/:[^/]+/g, "\\d+");
    return methods.includes(method) && new RegExp(`^${pattern}$`).test(path);
  });
}

async function proxy(request: NextRequest, context: RouteContext) {
  const { path: segments } = await context.params;
  if (segments.some(segment => segment === "." || segment === ".." || segment.includes("/"))) return NextResponse.json({ message: "Invalid path" }, { status: 400 });
  const path = `/${segments.map(encodeURIComponent).join("/")}`;
  const isPublic = (request.method === "GET" && publicGetRoutes.some(route => route.test(path))) || (path === "/api/v1/user/register" && request.method === "POST");
  if (!isPublic && !isUnauthenticatedBackendAccessEnabled()) {
    return NextResponse.json({ message: "User-scoped access requires the configured development or isolated staging environment." }, { status: 403 });
  }
  if (!isAllowed(path, request.method)) {
    return NextResponse.json({ message: "This documented API route is not enabled." }, { status: 404 });
  }
  const configuredBaseUrl = process.env[API_BASE_URL_ENV] || "http://localhost:8080";
  let baseUrl: string;
  try {
    const parsedBaseUrl = new URL(configuredBaseUrl);
    if (parsedBaseUrl.protocol !== "http:" && parsedBaseUrl.protocol !== "https:") throw new Error("Unsupported protocol");
    baseUrl = parsedBaseUrl.origin + parsedBaseUrl.pathname.replace(/\/$/, "");
  } catch {
    return NextResponse.json({ message: "API_BASE_URL must be a valid HTTP(S) URL." }, { status: 500 });
  }
  try {
    const upstream = await fetch(`${baseUrl}${path}${request.nextUrl.search}`, {
      method: request.method,
      headers: {
        "Accept": "application/json",
        "Accept-Language": request.headers.get("accept-language")?.startsWith("en") ? "en" : "ar",
        ...(request.headers.get("content-type") ? { "Content-Type": request.headers.get("content-type")! } : {}),
        ...(request.headers.get("idempotency-key") ? { "Idempotency-Key": request.headers.get("idempotency-key")! } : {}),
      },
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
      cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(60_000)]),
    });
    const responseBody = upstream.status === 204 ? null : await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type");
    return new Response(responseBody, {
      status: upstream.status,
      headers: contentType ? { "Content-Type": contentType, "Cache-Control": "no-store" } : { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ message: "Backend is unavailable." }, { status: 503 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
