/** Read-only timestamps; never used to serialize calendar inputs. */
export function formatTimestamp(value: string | null | undefined, locale: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", calendar: "gregory" }).format(date);
}
