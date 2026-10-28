"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { useLocale } from "next-intl";
import { useReducedMotion } from "motion/react";
import { ArrowDown, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@/components/ui/message-scroller";
import { MadarAvatar } from "./madar-avatar";
import { AssistantComposer } from "./assistant-composer";
import { AssistantMarkdown } from "./assistant-markdown";
import { AssistantToolBlock } from "./assistant-tool-block";
import { useAssistant } from "../assistant-context";
import { ChatPropertyResults } from "./chat-property-results";
import { Link } from "@/i18n/navigation";

function AssistantWelcome() {
  const ar = useLocale() === "ar";
  const { send, open, canChat, busy } = useAssistant();
  const prompts: { flow: string; text: string }[] = [
    {
      flow: "discover",
      text: ar ? "ساعدني ألقى شقة مناسبة" : "Help me find a suitable apartment",
    },
    { flow: "commute", text: ar ? "أبغى سكن قريب من دوامي" : "Find a home near my work" },
    {
      flow: "services",
      text: ar ? "وش تقدر تساعدني فيه؟" : "What can you help me with?",
    },
    {
      flow: "preferences",
      text: ar ? "اشرح تفضيلاتي المحفوظة" : "Explain my saved preferences",
    },
  ];
  return (
    <div className="flex flex-col gap-4 py-3">
      <MadarAvatar
        className="size-16"
        playing={open}
      />
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-semibold">
          {ar ? "أهلًا، أنا مساعد مدار." : "Hello, I’m MADAR Assistant."}
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          {ar
            ? "اسألني عن البيوت والأماكن والخدمات اللي تهمك."
            : "Ask about homes, places, and nearby services."}
        </p>
        <p className="text-xs leading-5 text-muted-foreground">
          {ar
            ? "أستخدم البيانات المتاحة، وأي تغيير في حسابك يحتاج تأكيدك."
            : "I use available data. Changes to your account require your confirmation."}
        </p>
      </div>
      <div className="grid gap-2">
        {prompts.map((prompt) => (
          <Button
            key={prompt.flow}
            type="button"
            variant="outline"
            className="h-auto min-h-10 justify-start px-3 py-2 text-start whitespace-normal"
            disabled={!canChat || busy}
            onClick={() => send({ type: "text", text: prompt.text }, prompt.text)}
          >
            {prompt.text}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default function AssistantDialog({
  triggerRef,
}: {
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const ar = useLocale() === "ar";
  const reduced = useReducedMotion();
  const {
    state,
    open,
    setOpen,
    reset,
    busy,
    canChat,
    clearError,
    clearing,
    accountData,
  } = useAssistant();
  const input = useRef<HTMLTextAreaElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const newButton = useRef<HTMLButtonElement>(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const lastAssistant = state.messages.findLast(
    (message) => message.role === "assistant",
  )?.id;
  useEffect(() => {
    if (!open) return;
    const viewport = window.visualViewport;
    if (!viewport) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const element = panel.current;
        if (!element) return;
        element.style.setProperty("--assistant-vheight", `${viewport.height}px`);
        element.style.setProperty("--assistant-vtop", `${viewport.offsetTop}px`);
        element.style.setProperty(
          "--assistant-vbottom",
          `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`,
        );
      });
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [open]);
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <MessageScrollerProvider
        autoScroll
        defaultScrollPosition="end"
        key={state.revision}
      >
        <DialogContent
          ref={panel}
          keepMounted
          showCloseButton={false}
          dir={ar ? "rtl" : "ltr"}
          finalFocus={triggerRef}
          initialFocus={(type) => (type === "touch" ? panel.current : input.current)}
          className="[--assistant-gutter:max(0.75rem,env(safe-area-inset-left),env(safe-area-inset-right),env(safe-area-inset-top),env(safe-area-inset-bottom))] start-auto end-(--assistant-gutter) top-[calc(var(--assistant-vtop,0px)+var(--assistant-gutter))] bottom-auto flex h-[min(38rem,calc(var(--assistant-vheight,100dvh)-2*var(--assistant-gutter)))] max-h-[calc(var(--assistant-vheight,100dvh)-2*var(--assistant-gutter))] w-[min(28rem,calc(100vw-2*var(--assistant-gutter)))] max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-3xl border border-border/70 bg-card p-0 text-card-foreground shadow-xl ring-0 rtl:translate-x-0 sm:top-auto sm:bottom-[calc(var(--assistant-vbottom,0px)+var(--assistant-gutter))] sm:max-w-none lg:w-[min(32rem,calc(100vw-2*var(--assistant-gutter)))] lg:h-[min(42rem,calc(var(--assistant-vheight,100dvh)-2*var(--assistant-gutter)))] motion-reduce:animate-none"
        >
          <header className="flex shrink-0 items-center gap-2 border-b border-border/50 px-3 py-1.5 sm:px-4">
            <MadarAvatar
              className="size-10"
              state={state.pending ? "thinking" : "idle"}
              playing={open}
            />
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-sm leading-5">
                {ar ? "مساعد مدار" : "MADAR Assistant"}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-caption leading-4">
                {ar ? "محادثة ومساعدة في الاختيار" : "Chat and guided tools"}
              </DialogDescription>
            </div>
            <Button
              ref={newButton}
              disabled={busy}
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 shrink-0 rounded-full"
              aria-label={ar ? "محادثة جديدة" : "New conversation"}
              title={ar ? "محادثة جديدة" : "New conversation"}
              onClick={() => setConfirmNew(true)}
            >
              <Plus />
            </Button>
            <DialogClose
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10 shrink-0 rounded-full"
                />
              }
              aria-label={ar ? "إغلاق المساعد" : "Close assistant"}
            >
              <X />
            </DialogClose>
          </header>
          <div className="min-h-0 flex-1">
            <MessageScroller>
              <MessageScrollerViewport
                aria-label={ar ? "رسائل المساعد" : "Assistant messages"}
                className="outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <MessageScrollerContent className="gap-4 p-3 sm:p-4">
                  {!state.messages.length ? (
                    <MessageScrollerItem messageId="welcome">
                      <AssistantWelcome />
                    </MessageScrollerItem>
                  ) : (
                    state.messages.map((message) => (
                      <MessageScrollerItem
                        key={message.id}
                        messageId={message.id}
                        scrollAnchor={message.role === "user"}
                      >
                        <Message align={message.role === "user" ? "end" : "start"}>
                          {message.role === "assistant" ? (
                            <MessageAvatar className="min-w-8 self-start bg-transparent">
                              <MadarAvatar
                                className="size-8"
                                playing={
                                  open && message.id === lastAssistant && !state.pending
                                }
                              />
                            </MessageAvatar>
                          ) : null}
                          <MessageContent className="gap-2">
                            {message.role === "user" ? (
                              <Bubble
                                variant="secondary"
                                align="end"
                                className="max-w-[90%]"
                              >
                                <BubbleContent
                                  dir="auto"
                                  className="rounded-2xl px-3 py-2 leading-6 whitespace-pre-wrap [overflow-wrap:anywhere]"
                                >
                                  {message.text}
                                </BubbleContent>
                              </Bubble>
                            ) : (
                              <>
                                <div role={message.error ? "alert" : undefined}>
                                  <AssistantMarkdown text={message.text} />
                                </div>
                                {message.origin === "frontend" ? (
                                  <p className="text-caption text-muted-foreground">
                                    {ar
                                      ? "اقتراح من الأداة، مو رد من المساعد"
                                      : "Tool suggestion, not an assistant response"}
                                  </p>
                                ) : null}
                                {message.properties?.length ? (
                                  <ChatPropertyResults properties={message.properties} />
                                ) : null}
                                {message.blocks?.map((block, index) => (
                                  <AssistantToolBlock
                                    key={index}
                                    block={block}
                                  />
                                ))}
                              </>
                            )}
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                    ))
                  )}
                  {state.pending ? (
                    <MessageScrollerItem messageId="thinking">
                      <Message>
                        <MessageAvatar className="min-w-8 self-start bg-transparent">
                          <MadarAvatar
                            state="thinking"
                            className="size-8"
                            playing={open}
                          />
                        </MessageAvatar>
                        <MessageContent className="gap-2">
                          <p
                            role="status"
                            className="py-1.5 text-xs leading-5 text-muted-foreground"
                          >
                            {ar ? "ننتظر رد مساعد مدار" : "Waiting for MADAR Assistant"}
                          </p>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  ) : null}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton
                behavior={reduced ? "instant" : "smooth"}
                aria-label={ar ? "الانتقال لآخر رسالة" : "Jump to latest message"}
                className="size-10 motion-reduce:transition-none"
              >
                <ArrowDown />
              </MessageScrollerButton>
            </MessageScroller>
          </div>
          {!canChat && accountData.enabled ? (
            <div className="px-3">
              <Button
                nativeButton={false}
                variant="link"
                size="sm"
                render={
                  <Link
                    href="/login"
                    onNavigate={() => setOpen(false)}
                  />
                }
              >
                {ar ? "سجّل دخولك للمتابعة" : "Sign in to continue"}
              </Button>
            </div>
          ) : null}
          <AssistantComposer inputRef={input} />
          <AlertDialog
            open={confirmNew}
            onOpenChange={(value) => {
              if (!clearing) setConfirmNew(value);
            }}
          >
            <AlertDialogContent
              dir={ar ? "rtl" : "ltr"}
              finalFocus={newButton}
              className="max-w-[calc(100vw-2rem)] sm:max-w-sm"
            >
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {ar ? "نبدأ محادثة جديدة؟" : "Start a new conversation?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {ar
                    ? "راح تُمسح المحادثة واختياراتك فيها بعد التأكيد."
                    : "Your conversation and its selections will be cleared after confirmation."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {clearError ? (
                <p
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {clearError}
                </p>
              ) : null}
              {!canChat ? (
                <p className="text-xs text-muted-foreground">
                  {ar
                    ? "راح تُمسح الرسائل الظاهرة في هذا المتصفح فقط."
                    : "Only messages shown in this browser will be cleared."}
                </p>
              ) : null}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={clearing}>
                  {ar ? "الاحتفاظ بالمحادثة" : "Keep conversation"}
                </AlertDialogCancel>
                <Button
                  disabled={busy}
                  onClick={async () => {
                    if (await reset()) setConfirmNew(false);
                  }}
                >
                  {clearing
                    ? ar
                      ? "نبدأ محادثة جديدة"
                      : "Starting a new conversation"
                    : ar
                      ? "محادثة جديدة"
                      : "New conversation"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogContent>
      </MessageScrollerProvider>
    </Dialog>
  );
}
