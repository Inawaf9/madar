"use client";
import { useLocale } from "next-intl";
import { ErrorState } from "@/components/shared/error-state";

/** Keep cached content in place during background refreshes and refresh failures. */
export function QueryFeedback({ query }: { query: {
  data: unknown; isError: boolean; isFetching: boolean; isPending: boolean;
  error: unknown; refetch: () => unknown;
} }) {
  const ar = useLocale() === "ar";
  if (query.data === undefined || (query.isError && query.data === null)) return null;
  if (query.isError && Array.isArray(query.data) && !query.data.length) return null;
  if (query.isError) return <div className="mb-4 flex flex-col gap-2"><ErrorState error={query.error} retry={() => { if (!query.isFetching) void query.refetch(); }} retryDisabled={query.isFetching} /><p className="text-xs text-muted-foreground">{ar ? "المعروض آخر بيانات متاحة؛ تعذّر تحديثها الآن." : "Showing the last available data. It could not be refreshed."}</p></div>;
  if (query.isFetching && !query.isPending) return <p role="status" className="mb-3 text-xs text-muted-foreground">{ar ? "جارٍ تحديث البيانات…" : "Updating data…"}</p>;
  return null;
}
