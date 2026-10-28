"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ErrorState } from "@/components/shared/error-state";
import { mapAssistantHousing } from "../assistant-data-adapters";
import { categories } from "@/lib/api/discovery-contracts";
import { getUserId } from "@/lib/user-id";
import { useAssistant } from "../assistant-context";

export function AccountContextPanel() {
  const ar = useLocale() === "ar";
  const { accountData: data, send, setOpen, busy } = useAssistant();
  const cache = useQueryClient();
  const [mapping, setMapping] = useState(false);
  const [error, setError] = useState<unknown>();
  const [notice, setNotice] = useState(false);
  const ownerRef = useRef(data.account.owner);
  useEffect(() => {
    ownerRef.current = data.account.owner;
    return () => {
      ownerRef.current = null;
    };
  }, [data.account.owner]);
  if (!data.enabled)
    return (
      <p className="text-xs text-muted-foreground">
        {ar
          ? "بيانات حسابك مو متاحة في المساعد الآن."
          : "Your account data is unavailable in the assistant right now."}
      </p>
    );
  if (!data.userId)
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>
          {ar
            ? "لم تسجّل الدخول؛ اختيار الموقع متاح دون إرسال محادثة شخصية."
            : "You are signed out. Location selection remains available without personal chat."}
        </span>
        <Button
          nativeButton={false}
          render={
            <Link
              href="/login"
              onNavigate={() => setOpen(false)}
            />
          }
          variant="ghost"
          size="sm"
        >
          {ar ? "فتح تسجيل الدخول" : "Open sign in"}
        </Button>
      </div>
    );
  if (!data.connected)
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-10 rounded-full"
        onClick={data.connect}
      >
        {ar ? "عرض بيانات حسابي" : "View my account"}
      </Button>
    );
  const apply = async () => {
    const housing = data.account.housing;
    if (!housing || mapping || busy) return;
    const owner = data.account.owner;
    setMapping(true);
    setError(undefined);
    setNotice(false);
    try {
      const mapped = await mapAssistantHousing(cache, housing);
      if (owner !== ownerRef.current || owner !== Number(getUserId())) return;
      setNotice(mapped.issues.length > 0);
      send(
        { type: "open-tool", tool: "search", initial: mapped.filters },
        ar
          ? "استخدام تفضيلات الحساب في بحث مؤقت"
          : "Use account preferences in temporary search",
      );
    } catch (reason) {
      setError(reason);
    } finally {
      setMapping(false);
    }
  };
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl bg-secondary/30 p-3">
      <p className="text-xs font-medium">
        {ar
          ? "تقدر تستخدم بيانات حسابك هنا للاختيار. الحفظ يتم من صفحات الحساب."
          : "Use your account details to explore options here. Save changes on the account pages."}
      </p>
      <p className="text-xs text-muted-foreground">
        {data.housing.isPending
          ? ar
            ? "نحمّل تفضيلاتك"
            : "Loading preferences"
          : data.housing.isError
            ? ar
              ? "التفضيلات غير متاحة"
              : "Preferences unavailable"
            : data.account.housing
              ? `${data.account.housing.city} · ${data.account.housing.maxBudget} SAR`
              : ar
                ? "لا تفضيلات محفوظة"
                : "No saved preferences"}
      </p>
      <p className="text-xs text-muted-foreground">
        {data.places.isError || data.saved.isError
          ? ar
            ? "بعض القوائم ما تحمّلت. حاول مرة ثانية أدناه."
            : "Some lists failed to load. Retry below."
          : data.places.isPending || data.saved.isPending
            ? ar
              ? "نحمّل قوائمك"
              : "Loading lists"
            : `${data.account.places.length} ${ar ? "أماكن" : "places"} · ${data.account.saved.length} ${ar ? "بيوت محفوظة" : "saved Properties"}`}
      </p>
      {[data.housing, data.places, data.saved, data.home]
        .filter((query) => query.isError)
        .map((query, index) => (
          <ErrorState
            key={index}
            error={query.error}
            retry={() => void query.refetch()}
            retryDisabled={query.isFetching}
          />
        ))}
      <div className="flex flex-wrap gap-1">
        {data.account.home ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() =>
              send(
                {
                  type: "open-tool",
                  tool: "home",
                  initial: {
                    latitude: data.account.home!.latitude,
                    longitude: data.account.home!.longitude,
                    source: data.account.home!.source || "",
                    externalPropertyId: data.account.home!.externalPropertyId || "",
                    movedInAt: data.account.home!.movedInAt || "",
                  },
                },
                ar ? "تعديل نسخة منزل مؤقتة" : "Edit temporary home copy",
              )
            }
          >
            {ar ? "استخدام منزلي المحفوظ" : "Use my saved home"}
          </Button>
        ) : null}
        {data.account.housing ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={mapping || busy}
              onClick={() => void apply()}
            >
              {ar ? "استخدام للبحث" : "Use for search"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() =>
                send(
                  {
                    type: "open-tool",
                    tool: "housing",
                    initial: {
                      region: data.account.housing!.region,
                      city: data.account.housing!.city,
                      district: data.account.housing!.district || "",
                      maxBudget: data.account.housing!.maxBudget,
                      listingType: data.account.housing!.listingType,
                      propertyType: data.account.housing!.propertyType,
                      interests: (data.account.housing!.interests || [])
                        .map(
                          (code) =>
                            (
                              ({ fitness: "gym", education: "school" }) as Record<
                                string,
                                string
                              >
                            )[code] ?? code,
                        )
                        .filter((code) =>
                          (categories as readonly string[]).includes(code),
                        ),
                      occupantsCount: data.account.housing!.occupantsCount ?? undefined,
                    },
                  },
                  ar ? "تعديل نسخة تفضيلات مؤقتة" : "Edit a temporary preference copy",
                )
              }
            >
              {ar ? "تعديل نسخة مؤقتة" : "Edit temporary copy"}
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() =>
              send(
                { type: "open-tool", tool: "housing" },
                ar ? "إعداد اختيارات تفضيلات مؤقتة" : "Set temporary preference choices",
              )
            }
          >
            {ar ? "إعداد التفضيلات" : "Set preferences"}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={data.disconnect}
        >
          {ar ? "إيقاف القراءة" : "Stop reading"}
        </Button>
      </div>
      {error ? (
        <ErrorState
          error={error}
          retry={() => void apply()}
          retryDisabled={mapping}
        />
      ) : null}
      {notice ? (
        <p className="text-xs text-muted-foreground">
          {ar
            ? "بعض القيم لم تطابق الكتالوج؛ راجع الاختيارات."
            : "Some values did not match the catalog. Review the choices."}
        </p>
      ) : null}
    </div>
  );
}
