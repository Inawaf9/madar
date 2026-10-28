"use client";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { propertyHref } from "@/features/properties/format";
import { Button } from "@/components/ui/button";
import { serializeQuery } from "@/lib/api/query";
import { searchSchema } from "@/lib/api/discovery-contracts";
import type { AssistantActionResult } from "../assistant-interaction-state";
import { useAssistant } from "../assistant-context";

/** Explicit client affordances, never model-returned structured actions. */
export function LocalSelectionResult({ result }: { result: AssistantActionResult }) {
  const ar = useLocale() === "ar";
  const { send, setOpen, state, canChat, busy } = useAssistant();
  const tool = result.tool;
  const data = result.data || {};
  const route =
    tool === "housing" || tool === "housing-remove"
      ? "/profile"
      : tool === "interests"
        ? "/interests"
        : ["place", "remove-place", "destinations"].includes(tool || "")
          ? "/locations"
          : ["comparison", "comparison-select", "analysis"].includes(tool || "")
            ? "/compare"
            : ["home", "confirm-move", "property-remove"].includes(tool || "")
              ? "/neighborhood"
              : tool === "commute"
                ? "/payments"
                : tool === "save-property" || tool === "saved-properties"
                  ? "/saved"
                  : "/properties";
  const filters = searchSchema.safeParse(state.selections.search);
  const searchHref = filters.success
    ? `/properties?${serializeQuery({ ...filters.data, searchState: "manual" })}`
    : "/properties";
  const location =
    tool === "location" &&
    typeof data.latitude === "number" &&
    typeof data.longitude === "number"
      ? { latitude: data.latitude, longitude: data.longitude }
      : null;
  const referenceHref =
    tool === "property-reference" &&
    typeof data.source === "string" &&
    typeof data.externalPropertyId === "string"
      ? propertyHref({ source: data.source, externalId: data.externalPropertyId })
      : null;
  const href =
    referenceHref ||
    (tool === "search" || tool === "budget" || tool === "specifications"
      ? searchHref
      : route);
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {location ? (
        <>
          <p className="text-xs text-muted-foreground">
            {ar
              ? "إرسال الموقع يتطلب موافقتك؛ سيُرسل كنص عادي، لا كاستكمال تلقائي لمهمة."
              : "Sharing this location requires your choice; it sends plain text, not an automatic task continuation."}
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={!canChat || busy}
            onClick={() => {
              const text = ar
                ? `هذا موقع اخترته مؤقتًا: خط العرض ${location.latitude}، خط الطول ${location.longitude}. أريد البحث قربه؛ اسألني عن المعايير الناقصة.`
                : `I temporarily selected latitude ${location.latitude}, longitude ${location.longitude}. Help me search nearby and ask for missing criteria.`;
              send({ type: "text", text }, text);
            }}
          >
            {ar ? "إرسال الموقع كرسالة" : "Send location as a message"}
          </Button>
        </>
      ) : null}
      <div className="flex flex-wrap gap-1">
        <Button
          nativeButton={false}
          variant="outline"
          size="sm"
          render={
            <Link
              href={
                tool === "navigation" && typeof data.route === "string"
                  ? data.route
                  : href
              }
              onNavigate={() => setOpen(false)}
            />
          }
        >
          {ar ? "افتح الصفحة لإكمال الإجراء" : "Open page to continue"}
        </Button>
        {tool === "location" ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() =>
              send(
                { type: "open-tool", tool: "services" },
                ar ? "شوف الخدمات القريبة" : "Explore nearby services",
              )
            }
          >
            {ar ? "الخدمات القريبة" : "Nearby services"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
