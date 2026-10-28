import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LegalDocument } from "@/features/marketing/legal/legal-document";

const content = {
  ar: {
    label: "استخدام مدار",
    title: "الشروط والأحكام",
    intro:
      "هنا نوضح الشروط اللي تنظم استخدام مدار والخدمات المتوفرة فيه، وحقوق ومسؤوليات المستخدم والمنصة.",
    updated: "آخر تحديث: 26 أكتوبر 2026",
    sections: [
      {
        title: "1. التعريف بالمنصة",
        paragraphs: [
          "مدار منصة تقنية تساعد المستخدمين في البحث عن البيوت ومقارنتها وتحليل مواقعها والخدمات القريبة منها وأوقات التنقل.",
          "تُقدم المنصة بواسطة [الاسم القانوني للمشغّل].",
        ],
      },
      {
        title: "2. قبول الشروط",
        paragraphs: [
          "باستخدام مدار، فإنك تقر بمراجعة الشروط المطبقة على الخدمات اللي تستخدمها. وأي موافقة إلكترونية مطلوبة يجب الحصول عليها من خلال الآلية المعتمدة في المنصة.",
          "إذا ما كانت الشروط مناسبة لك، يمكنك التوقف عن استخدام الخدمة.",
        ],
      },
      {
        title: "3. الحسابات",
        paragraphs: [
          "قد تحتاج تنشئ حساب للوصول لبعض الميزات مثل حفظ البيوت وتفضيلات السكن وتحليل المشاوير.",
          "أنت مسؤول عن تقديم معلومات صحيحة والمحافظة على سرية بيانات الدخول، وإبلاغنا إذا لاحظت استخدامًا غير مصرح به لحسابك.",
        ],
      },
      {
        title: "4. معلومات البيوت",
        paragraphs: [
          "قد يعرض مدار بيانات سكنية مصدرها جهات أو مزودو معلومات خارجيون. ويمكن أن تتغير الأسعار والتفاصيل والتوفر بعد عرضها.",
          "لا يُعد عرض البيت في مدار ضمانًا لتوفره أو دقة جميع بياناته. تأكد من التفاصيل الأساسية مع الجهة المعنية قبل اتخاذ قرار مالي أو تعاقدي.",
        ],
      },
      {
        title: "5. المقارنات والتوصيات",
        paragraphs: [
          "يوفر مدار أدوات تساعدك تقارن بين البيوت وتقيّم الخيارات بناءً على تفضيلاتك واحتياجاتك.",
          "نتائج المقارنات والتوصيات تساعدك على الاختيار، لكنها ليست تقييمًا معتمدًا لقيمة البيت ولا استشارة مالية أو قانونية.",
        ],
      },
      {
        title: "6. الخرائط والمشاوير",
        paragraphs: [
          "تُحسب المسافات وأوقات الوصول باستخدام البيانات المتاحة وخدمات المسارات المرتبطة بالمنصة.",
          "قد تختلف مدة المشوار الفعلية بسبب الزحام والطرق والظروف المتغيرة. لذلك تعتبر النتائج تقديرية وليست ضمانًا لوقت وصول محدد.",
        ],
      },
      {
        title: "7. مساعد مدار الذكي",
        paragraphs: [
          "يمكنك استخدام مساعد مدار للحصول على معلومات ومساعدة في فهم خيارات السكن.",
          "قد تحتوي الردود المولدة بالذكاء الاصطناعي على معلومات غير دقيقة أو غير مكتملة. راجع التفاصيل المهمة من مصادرها قبل الاعتماد عليها.",
        ],
      },
      {
        title: "8. الخدمات المدفوعة",
        paragraphs: [
          "قد يوفر مدار خدمات مدفوعة مثل تقارير التنقل. يُعرض السعر ونطاق الخدمة ومدة الاستفادة قبل إتمام عملية الدفع.",
          "تخضع المدفوعات وأي طلبات استرداد للسياسة المعلنة عند الشراء وللأنظمة المطبقة. يجب استكمال تفاصيل الإلغاء والاسترداد وبيانات مقدم الخدمة قبل نشر هذه الشروط.",
        ],
      },
      {
        title: "9. الاستخدام المسموح",
        paragraphs: [
          "استخدم مدار للأغراض المشروعة وبطريقة ما تضر المستخدمين الآخرين أو تعطل الخدمة.",
          "يُمنع محاولة الوصول لحسابات الآخرين دون تصريح، أو إساءة استخدام واجهات البرمجة، أو جمع البيانات آليًا بطرق غير مصرح بها، أو التحايل على قيود الوصول والخدمات المدفوعة.",
        ],
      },
      {
        title: "10. الملكية الفكرية",
        paragraphs: [
          "تظل حقوق العلامات التجارية والتصاميم والبرمجيات والمحتوى محفوظة لأصحابها وفق الأنظمة والاتفاقيات المطبقة.",
          "استخدام مدار ما يمنحك حق نسخ مكوناته أو إعادة توزيع محتواه خارج الحدود المسموح بها.",
        ],
      },
      {
        title: "11. توفر الخدمة",
        paragraphs: [
          "قد تتأثر بعض الميزات بالصيانة أو الأعطال أو توفر خدمات الأطراف الخارجية.",
          "نسعى لتقديم تجربة مستقرة، لكن لا نضمن توفر جميع الوظائف دون انقطاع في كل الأوقات.",
        ],
      },
      {
        title: "12. تعليق الحساب وإنهاؤه",
        paragraphs: [
          "قد يتم تقييد الحساب أو تعليقه عند وجود مخالفة للشروط أو مخاطر أمنية أو متطلبات نظامية، مع مراعاة الحقوق والالتزامات المطبقة.",
          "تخضع طلبات حذف الحساب والبيانات لسياسة الخصوصية والالتزامات النظامية ذات العلاقة.",
        ],
      },
      {
        title: "13. حدود المسؤولية",
        paragraphs: [
          "يقدم مدار أدوات معلوماتية تساعد على تقييم الخيارات السكنية، ولا يحل محل التحقق المستقل أو الاستشارة المتخصصة عند الحاجة.",
          "لا يُقصد بهذه الشروط استبعاد أي مسؤولية أو حق لا يجوز استبعاده بموجب الأنظمة المطبقة في المملكة العربية السعودية.",
        ],
      },
      {
        title: "14. التعديلات",
        paragraphs: [
          "قد تتغير هذه الشروط عند تطوير الخدمات أو تغير المتطلبات النظامية. سنوضح تاريخ آخر تحديث ونقدم الإشعارات المطلوبة عند الاقتضاء.",
        ],
      },
      {
        title: "15. التواصل",
        paragraphs: [
          "للاستفسارات المتعلقة باستخدام مدار أو هذه الشروط، تواصل مع [الاسم القانوني للمشغّل] عبر [بريد التواصل الرسمي].",
        ],
      },
    ],
    back: "العودة للرئيسية",
    privacy: "سياسة الخصوصية",
  },
  en: {
    label: "Using MADAR",
    title: "Terms of Use",
    intro:
      "These terms explain the conditions governing your use of MADAR, its services, and the responsibilities of users and the platform.",
    updated: "Last updated: October 26, 2026",
    sections: [
      {
        title: "1. About MADAR",
        paragraphs: [
          "MADAR is a technology platform for home discovery, comparisons, neighborhood information, and commute analysis.",
          "The platform is operated by [Legal Operator Name].",
        ],
      },
      {
        title: "2. Acceptance",
        paragraphs: [
          "By using MADAR, you acknowledge the terms applicable to the services you access. Where affirmative acceptance is required, it must be obtained through the platform's applicable process.",
          "If you disagree with these terms, you may stop using the service.",
        ],
      },
      {
        title: "3. Accounts",
        paragraphs: [
          "Certain features require an account. You are responsible for providing accurate information, protecting your credentials, and reporting suspected unauthorized access.",
        ],
      },
      {
        title: "4. Home Information",
        paragraphs: [
          "Home listings may come from external providers. Prices, availability, and other details can change.",
          "MADAR does not guarantee the availability or accuracy of every listing. Verify important details with the relevant party before making financial or contractual decisions.",
        ],
      },
      {
        title: "5. Comparisons and Recommendations",
        paragraphs: [
          "MADAR provides tools to help evaluate housing options based on preferences and relevant home information.",
          "Recommendations and comparisons are for information only. They are not formal valuations of a home's market value or financial or legal advice.",
        ],
      },
      {
        title: "6. Maps and Commute Estimates",
        paragraphs: [
          "Travel distances and estimated times depend on available mapping and routing data.",
          "Actual journeys may differ due to traffic, road conditions, and other factors. Estimates do not guarantee arrival times.",
        ],
      },
      {
        title: "7. AI Assistant",
        paragraphs: [
          "MADAR's AI assistant may help you explore and understand housing options.",
          "AI-generated responses can be incomplete or inaccurate. Verify important information independently before relying on it.",
        ],
      },
      {
        title: "8. Paid Services",
        paragraphs: [
          "Certain features, such as commute reports, may require payment. Pricing, service scope, and access duration should be presented before checkout.",
          "Payments and refund requests are subject to the disclosed purchase terms and applicable law. Cancellation and refund details must be finalized before publication.",
        ],
      },
      {
        title: "9. Acceptable Use",
        paragraphs: [
          "Use MADAR lawfully and without interfering with other users or the service.",
          "Unauthorized account access, API abuse, unauthorized automated data collection, and attempts to bypass access restrictions are prohibited.",
        ],
      },
      {
        title: "10. Intellectual Property",
        paragraphs: [
          "Applicable rights in software, branding, designs, and content remain with their respective owners.",
          "Using MADAR does not grant permission to reproduce or redistribute protected materials beyond permitted uses.",
        ],
      },
      {
        title: "11. Availability",
        paragraphs: [
          "Features may be affected by maintenance, technical issues, or third-party service availability.",
          "Continuous or uninterrupted availability is not guaranteed.",
        ],
      },
      {
        title: "12. Account Restrictions",
        paragraphs: [
          "Accounts may be restricted or suspended for violations, security concerns, or legal requirements, subject to applicable rights and obligations.",
          "Account and data deletion requests are governed by the Privacy Policy and applicable law.",
        ],
      },
      {
        title: "13. Liability",
        paragraphs: [
          "MADAR provides informational tools and does not replace independent verification or professional advice.",
          "Nothing in these terms is intended to exclude rights or liabilities that cannot lawfully be excluded under applicable Saudi law.",
        ],
      },
      {
        title: "14. Changes",
        paragraphs: [
          "These terms may change as services or legal requirements evolve. Revision dates and required notices will be provided as applicable.",
        ],
      },
      {
        title: "15. Contact",
        paragraphs: [
          "For inquiries, contact [Legal Operator Name] at [Official Contact Email].",
        ],
      },
    ],
    back: "Back to home",
    privacy: "Privacy Policy",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = locale === "ar" ? content.ar : content.en;
  return {
    title: copy.title,
    description: copy.intro,
    alternates: { languages: { ar: "/ar/terms", en: "/en/terms" } },
    openGraph: {
      title: copy.title,
      description: copy.intro,
      locale: locale === "ar" ? "ar_SA" : "en_US",
    },
  };
}

export default async function TermsPage() {
  const locale = await getLocale();
  const copy = locale === "ar" ? content.ar : content.en;
  return (
    <LegalDocument
      copy={copy}
      relatedHref="/privacy"
      relatedLabel={copy.privacy}
      backLabel={copy.back}
      contentsLabel={locale === "ar" ? "في هذه الصفحة" : "On this page"}
    />
  );
}
