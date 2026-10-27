import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError } from "@/lib/api/errors";
import { deleteSession } from "./session.server";
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, private",
      Vary: "Cookie",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export async function failure(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      await deleteSession();
    }
    return json(
      {
        message:
          error.backendMessage ||
          (error.status === 401
            ? "Unauthorized"
            : error.status === 403
              ? "Forbidden"
              : "Request failed"),
      },
      error.status,
    );
  }
  return json(
    {
      message:
        error instanceof z.ZodError || error instanceof SyntaxError
          ? "Invalid request"
          : "Service unavailable",
    },
    error instanceof z.ZodError || error instanceof SyntaxError ? 400 : 503,
  );
}
export async function readBody(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new ApiError("JSON required", 400);
  const text = await request.text();
  if (text.length > 32_768) throw new ApiError("Request too large", 413);
  if (text.length === 0) return undefined;
  return JSON.parse(text);
}
