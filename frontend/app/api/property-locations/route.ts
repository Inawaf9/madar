import { connection, NextResponse } from "next/server";
import { getLocationCatalog } from "@/lib/locations/catalog.server";
import { ApiError } from "@/lib/api/errors";

/** Frontend cache transport: return the complete, unchanged backend city array. */
export async function GET() {
  await connection();
  try { return NextResponse.json(await getLocationCatalog(2), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) {
    return NextResponse.json({ message: "Unable to retrieve location catalog" }, { status: error instanceof ApiError ? error.status : 503, headers: { "Cache-Control": "no-store" } });
  }
}
