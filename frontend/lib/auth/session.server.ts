import "server-only";
import { CompactEncrypt, compactDecrypt, decodeJwt } from "jose";
import { cookies } from "next/headers";
import { z } from "zod";
import { ApiError } from "@/lib/api/errors";
import {
  authResponseSchema,
  safeSessionSchema,
  roleSchema,
  type AuthResponse,
  type SafeSession,
} from "./contracts";
import { cookieEncryptionKey } from "./config.server";

const production = process.env.NODE_ENV === "production";
export const sessionCookie = production ? "__Host-madar-auth" : "madar-auth";
const legacyCookie = production ? "__Host-madar-session" : "madar-session";
const options = {
  httpOnly: true,
  secure: production,
  sameSite: "lax" as const,
  path: "/",
};
const cookieLimit = 3800;
const accessLifetime = 15 * 60_000;
const type = `madar-token-pair-v2:${sessionCookie}`;
const transportSchema = safeSessionSchema
  .extend({
    version: z.literal(2),
    accessToken: z.string().min(1),
    refreshToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    createdAt: z.number().int().positive(),
    expiresAt: z.number().int().positive(),
  })
  .strict();
export type SessionRecord = z.infer<typeof transportSchema>;
const claimsSchema = z.object({
  iss: z.literal("madar"),
  sub: z.string().regex(/^[1-9][0-9]*$/),
  role: roleSchema,
  exp: z.number().int().positive(),
});

// Decode only for consistency/expiry scheduling; Spring verifies every access JWT.
function tokenClaims(accessToken: string) {
  return claimsSchema.parse(decodeJwt(accessToken));
}
function validTransport(record: SessionRecord): boolean {
  const claims = tokenClaims(record.accessToken);
  return (
    claims.sub === String(record.userId) &&
    claims.role === record.role &&
    Buffer.from(record.refreshToken, "base64url").toString("base64url") ===
      record.refreshToken &&
    record.expiresAt <= claims.exp * 1000 &&
    record.expiresAt > record.createdAt &&
    record.expiresAt <= record.createdAt + accessLifetime &&
    record.expiresAt > Date.now()
  );
}
export function safeIdentity(record: SafeSession): SafeSession {
  return safeSessionSchema.parse(record);
}

/** Server-only read. Never rotate tokens or write cookies while rendering. */
export async function readSession(): Promise<SessionRecord | null> {
  const value = (await cookies()).get(sessionCookie)?.value;
  if (!value) return null;
  const key = cookieEncryptionKey();
  try {
    if (value.length > cookieLimit) return null;
    const { plaintext, protectedHeader } = await compactDecrypt(value, key, {
      keyManagementAlgorithms: ["dir"],
      contentEncryptionAlgorithms: ["A256GCM"],
    });
    if (protectedHeader.typ !== type) return null;
    const record = transportSchema.parse(JSON.parse(new TextDecoder().decode(plaintext)));
    return validTransport(record) ? record : null;
  } catch {
    return null;
  }
}

/** Writable context only. Backend revocation is handled explicitly by logout helpers. */
export async function deleteSession() {
  const jar = await cookies();
  jar.set(sessionCookie, "", { ...options, expires: new Date(0), maxAge: 0 });
  if (jar.has(legacyCookie))
    jar.set(legacyCookie, "", { ...options, expires: new Date(0), maxAge: 0 });
}

/** Atomically publish the exact trusted backend pair in one authenticated-encryption envelope. */
export async function createSession(input: AuthResponse): Promise<SafeSession> {
  const auth = authResponseSchema.parse(input);
  const key = cookieEncryptionKey();
  let record: SessionRecord;
  try {
    const claims = tokenClaims(auth.accessToken);
    const createdAt = Date.now();
    record = {
      ...safeIdentity(auth),
      version: 2,
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      createdAt,
      expiresAt: Math.min(claims.exp * 1000, createdAt + accessLifetime),
    };
    if (!validTransport(record)) throw new Error("Invalid upstream identity");
  } catch {
    throw new ApiError("Invalid authentication response", 502);
  }
  // Safe fallback: rotation is blocked until distributed coordination is available.
  // Both proofs are discarded at access expiry, rather than claiming an unsafe 30-day login.
  const value = await new CompactEncrypt(new TextEncoder().encode(JSON.stringify(record)))
    .setProtectedHeader({ alg: "dir", enc: "A256GCM", typ: type })
    .encrypt(key);
  if (value.length > cookieLimit)
    throw new ApiError("Authentication cookie too large", 502);
  const jar = await cookies();
  jar.set(sessionCookie, value, { ...options, expires: new Date(record.expiresAt) });
  if (jar.has(legacyCookie))
    jar.set(legacyCookie, "", { ...options, expires: new Date(0), maxAge: 0 });
  return safeIdentity(record);
}
export async function requireSession() {
  const session = await readSession();
  if (!session) throw new ApiError("Unauthorized", 401);
  return session;
}
export async function requireRole(role: SafeSession["role"]) {
  const session = await requireSession();
  if (session.role !== role) throw new ApiError("Forbidden", 403);
  return session;
}
export async function getAuthenticatedIdentity() {
  return safeIdentity(await requireSession());
}
export const getSession = readSession;
export const destroySession = deleteSession;
