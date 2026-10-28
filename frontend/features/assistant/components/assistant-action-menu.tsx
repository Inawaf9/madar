"use client";
import { useState } from "react";
import { useLocale } from "next-intl";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { assistantActionRegistry, type ToolName } from "../assistant-action-registry";
import { useAssistant } from "../assistant-context";
import { AccountContextPanel } from "./account-context-panel";
import { normalizeLocationName } from "@/lib/locations/normalize-name";

const groups: { id: string; label: [string, string]; tools: ToolName[] }[] = [
  {
    id: "properties",
    label: ["بيوت", "Homes"],
    tools: [
      "search",
      "budget",
      "specifications",
      "saved-properties",
      "property-reference",
      "comparison",
      "analysis",
      "weights",
      "reset-search",
    ],
  },
  {
    id: "places",
    label: ["مواقع", "Places"],
    tools: [
      "location",
      "destinations",
      "place",
      "services",
      "commute",
      "home",
      "confirm-move",
      "property-remove",
    ],
  },
  {
    id: "preferences",
    label: ["تفضيلات", "Preferences"],
    tools: ["housing", "interests", "housing-remove", "navigation"],
  },
];
export function AssistantActionMenu() {
  const ar = useLocale() === "ar";
  const { send, busy } = useAssistant();
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState("properties");
  const [query, setQuery] = useState("");
  const tools = query.trim()
    ? groups.flatMap((item) => item.tools)
    : groups.find((item) => item.id === group)!.tools;
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-10 rounded-full px-2 text-xs"
          />
        }
      >
        <SlidersHorizontal data-icon="inline-start" />
        {ar ? "إجراءات مدار" : "MADAR actions"}
      </PopoverTrigger>
      <PopoverContent
        aria-label={ar ? "إجراءات المساعد المعتمدة" : "Approved assistant actions"}
        align="start"
        className="max-h-[min(32rem,70dvh)] w-80 max-w-[calc(100vw-2rem)] gap-2 overflow-y-auto rounded-2xl p-3 motion-reduce:animate-none"
      >
        <Input
          aria-label={ar ? "بحث عن إجراء" : "Find an action"}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={ar ? "ابحث عن إجراء" : "Find an action"}
        />
        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label={ar ? "مجموعات الإجراءات" : "Action groups"}
        >
          {groups.map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant={item.id === group ? "secondary" : "ghost"}
              aria-pressed={item.id === group}
              className="min-h-10 rounded-full px-2"
              onClick={() => {
                setGroup(item.id);
                setQuery("");
              }}
            >
              {item.label[ar ? 0 : 1]}
            </Button>
          ))}
        </div>
        <div className="flex flex-col gap-0.5">
          {tools
            .filter((tool) =>
              normalizeLocationName(
                assistantActionRegistry[tool].title.join(" "),
              ).includes(normalizeLocationName(query)),
            )
            .map((tool) => (
              <Button
                key={tool}
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto min-h-10 justify-start py-2 text-start whitespace-normal"
                disabled={busy}
                onClick={() => {
                  send(
                    { type: "open-tool", tool },
                    assistantActionRegistry[tool].title[ar ? 0 : 1],
                  );
                  setOpen(false);
                }}
              >
                {assistantActionRegistry[tool].title[ar ? 0 : 1]}
              </Button>
            ))}
        </div>
        <details>
          <summary className="cursor-pointer py-2 text-xs text-muted-foreground">
            {ar ? "بيانات الحساب (عرض اختياري)" : "Account data (optional)"}
          </summary>
          <AccountContextPanel />
        </details>
        <p className="text-caption text-muted-foreground">
          {ar
            ? "الحفظ والدفع تتم من صفحاتها بعد تأكيدك."
            : "Save and pay from their pages after confirmation."}
        </p>
      </PopoverContent>
    </Popover>
  );
}
