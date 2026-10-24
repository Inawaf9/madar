"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalUserId } from "@/features/account/use-local-user-id";
import { MadarAvatar } from "./madar-avatar";
import { useAssistantAccountContext } from "./assistant-account-context";
import { useAssistantConversation } from "./use-assistant-conversation";
import { AssistantContext } from "./assistant-context";
import { useHydrated } from "@/hooks/use-hydrated";

const AssistantDialog = dynamic(() => import("./assistant-dialog"));
export function AssistantProvider({ chatEnabled = false }: { chatEnabled?: boolean }) {
  const ready = useHydrated();
  const userId = useLocalUserId();
  // Switching the development profile disposes requests and private UI state.
  return ready ? <AssistantRuntime key={`${userId ?? "guest"}:${chatEnabled}`} userId={userId} chatEnabled={chatEnabled} /> : null;
}
function AssistantRuntime({ userId, chatEnabled }: { userId: number | null; chatEnabled: boolean }) {
  const locale = useLocale(); const ar = locale === "ar";
  const [open, changeOpen] = useState(false); const [mounted, setMounted] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const accountData = useAssistantAccountContext(chatEnabled);
  const conversation = useAssistantConversation({ userId, chatEnabled, locale, accountData });
  const setOpen = (value: boolean) => { if (value) setMounted(true); changeOpen(value); };
  useEffect(() => {
    const show = () => { setMounted(true); changeOpen(true); };
    window.addEventListener("madar-assistant-open", show);
    return () => window.removeEventListener("madar-assistant-open", show);
  }, []);
  return <AssistantContext.Provider value={{ ...conversation, open, setOpen, accountData }}><DirectionProvider direction={ar ? "rtl" : "ltr"}>
    <Button ref={trigger} type="button" variant="outline" aria-label={ar ? "فتح مساعد مدار" : "Open MADAR Assistant"} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)} className="fixed end-[calc(var(--assistant-edge-gap,1rem)+max(env(safe-area-inset-right),env(safe-area-inset-left)))] bottom-[calc(var(--assistant-edge-gap,1rem)+env(safe-area-inset-bottom))] z-40 h-14 max-w-[calc(100vw-2*var(--assistant-edge-gap,1rem)-env(safe-area-inset-left)-env(safe-area-inset-right))] gap-1.5 rounded-full border-border/70 bg-card p-0.5 text-card-foreground shadow-lg transition-shadow hover:shadow-xl motion-reduce:transition-none sm:pe-3">
      <MadarAvatar variant="trigger" className="size-12" playing={!open} /><span className="hidden text-start sm:flex sm:flex-col"><span className="text-sm font-semibold">{ar ? "مساعد مدار" : "MADAR Assistant"}</span><span className="text-caption text-muted-foreground">{ar ? "مساعد السكن" : "Housing assistant"}</span></span><MessageCircle aria-hidden="true" className="hidden sm:block" />
    </Button>
    {mounted ? <AssistantDialog triggerRef={trigger} /> : null}
  </DirectionProvider></AssistantContext.Provider>;
}
