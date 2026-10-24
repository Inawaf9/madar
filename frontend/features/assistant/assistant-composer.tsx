"use client";
import { useEffect, type RefObject } from "react";
import { useLocale } from "next-intl";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AssistantActionMenu } from "./assistant-action-menu";
import { useAssistant } from "./assistant-context";
export function AssistantComposer({ inputRef }: { inputRef: RefObject<HTMLTextAreaElement | null> }) {
  const ar = useLocale() === "ar"; const { draft, setDraft, send, busy, canChat, unavailable, error, failedMessage } = useAssistant();
  useEffect(() => { const input = inputRef.current; if (input) { input.style.height = "auto"; input.style.height = `${Math.min(input.scrollHeight, 96)}px`; } }, [draft, inputRef]);
  const submit = () => { const text = draft.trim(); if (!text || busy || !canChat || draft.length > 500) return; send({ type: "text", text }, text); inputRef.current?.focus({ preventScroll: true }); };
  return <form onSubmit={event => { event.preventDefault(); submit(); }} className="shrink-0 border-t border-border/50 bg-card px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
    <AssistantActionMenu />
    <div className="flex items-end gap-2 rounded-2xl bg-secondary/40 p-1.5 focus-within:ring-2 focus-within:ring-ring/40"><Textarea ref={inputRef} value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(); } }} dir="auto" rows={1} maxLength={500} disabled={busy || !canChat} aria-describedby="assistant-composer-feedback" aria-label={ar ? "رسالتك لمساعد مدار" : "Message MADAR Assistant"} placeholder={ar ? "وش حاب نبدأ فيه؟" : "What would you like to explore?"} className="max-h-24 min-h-10 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0" /><Button type="submit" size="icon" disabled={!draft.trim() || busy || !canChat || draft.length > 500} aria-label={ar ? "إرسال الرسالة" : "Send message"} className="size-10 shrink-0 rounded-xl"><ArrowUp /></Button></div>
    <div id="assistant-composer-feedback" className="mt-1.5 flex flex-col gap-1 text-caption leading-5 text-muted-foreground">
      {!canChat ? <p role="status">{unavailable}</p> : <p>{draft.length}/500 · {ar ? "لغة الرد تتبع الرسالة؛ لا تُعدّ المحادثة تأكيدًا لتغيير حسابك." : "Reply language follows your message; chat does not confirm account changes."}</p>}
      {error ? <p role="alert" className="text-destructive">{error}</p> : null}
      {failedMessage && !busy && canChat ? <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => { setDraft(failedMessage); inputRef.current?.focus(); }}>{ar ? "مراجعة النص قبل إعادة الإرسال" : "Review text before resending"}</Button> : null}
    </div>
  </form>;
}
