import { Link } from "@/i18n/navigation";
export default function NotFound() { return <main className="mx-auto max-w-xl px-5 py-20"><h1 className="text-2xl font-bold">الصفحة غير موجودة</h1><p className="mt-4 text-muted-foreground">تحقق من الرابط أو عُد إلى استكشاف العقارات.</p><Link href="/properties" className="mt-6 inline-flex text-primary underline">استكشف العقارات</Link></main>; }
