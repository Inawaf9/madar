import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
export default async function NotFound() {
  const ar = (await getLocale()) === "ar";
  return (
    <main className="mx-auto max-w-xl px-5 py-20">
      <h1 className="text-2xl font-bold">{ar ? "ما لقينا الصفحة" : "Page not found"}</h1>
      <p className="mt-4 text-muted-foreground">
        {ar
          ? "تأكد من الرابط أو ارجع لتصفّح العقارات."
          : "Check the link or return to browsing properties."}
      </p>
      <Link
        href="/properties"
        className="mt-6 inline-flex text-primary underline"
      >
        {ar ? "تصفّح العقارات" : "Browse properties"}
      </Link>
    </main>
  );
}
