"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import { chatSchema } from "@/lib/api/chat";
import { sendChatMessage, clearChatConversation, chatErrorText, type ChatReply } from "@/lib/api/chat";
import { getUserId } from "@/lib/user-id";
import { assistantActionRegistry, type ToolInput } from "./assistant-action-registry";
import { assistantToolBlockSchema } from "./assistant-action-schemas";
import { emptySelections, toolDefaults, type AssistantInteractionState, type TemporarySelections } from "./assistant-interaction-state";
import { applyAssistantSelection } from "./assistant-selection-dispatcher";
import { adaptChatProperty } from "./chat-property-adapter";
import type { useAssistantAccountContext } from "./assistant-account-context";
import type { AssistantAction, AssistantMessage, ToolBlock } from "./types";

type Conversation = { messages: AssistantMessage[]; revision: number; pending: boolean; selections: TemporarySelections; interactions: Record<string, AssistantInteractionState> };
const initial = (): Conversation => ({ messages: [], revision: 0, pending: false, selections: emptySelections(), interactions: {} });
type Event = { type: "pending"; message: AssistantMessage } | { type: "reply"; message: AssistantMessage; reply: ChatReply; locale: string } | { type: "failed" } | { type: "local"; message: AssistantMessage; interaction: AssistantInteractionState } | { type: "interaction"; value: AssistantInteractionState } | { type: "selected"; selections: TemporarySelections; value: AssistantInteractionState } | { type: "reset" };
function reducer(state: Conversation, event: Event): Conversation {
  switch (event.type) {
    case "pending": return { ...state, pending: true, messages: [...state.messages, event.message] };
    case "reply": return { ...state, pending: false, messages: [...state.messages, event.message], selections: { ...state.selections, references: [...state.selections.references, ...event.reply.properties.flatMap((dto, index) => {
      const { property, listing } = adaptChatProperty(dto, event.locale);
      return property ? [{ id: `chat:${event.message.id}:${index}`, origin: "chat" as const, title: listing.title, listing: property, source: property.source, externalId: property.externalId! }] : [];
    })] } };
    case "failed": return { ...state, pending: false };
    case "local": return { ...state, messages: [...state.messages, event.message], interactions: { ...state.interactions, [event.interaction.blockId]: event.interaction } };
    case "interaction": return { ...state, interactions: { ...state.interactions, [event.value.blockId]: event.value } };
    case "selected": return { ...state, selections: event.selections, interactions: { ...state.interactions, [event.value.blockId]: event.value } };
    case "reset": return { ...initial(), revision: state.revision + 1 };
  }
}

export function useAssistantConversation({ userId, chatEnabled, locale, accountData }: { userId: number | null; chatEnabled: boolean; locale: string; accountData: ReturnType<typeof useAssistantAccountContext> }) {
  const ar = locale === "ar"; const [state, dispatch] = useReducer(reducer, undefined, initial);
  const [draft, setDraft] = useState(""); const [error, setError] = useState<string | null>(null); const [clearError, setClearError] = useState<string | null>(null); const [clearing, setClearing] = useState(false);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null); const locked = useRef(false); const epoch = useRef(0); const sequence = useRef(0);
  const mounted = useRef(true);
  const latest = useRef(state); useEffect(() => { latest.current = state; }, [state]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; request.current?.abort(); }; }, []);
  const canChat = chatEnabled && userId !== null;
  const unavailable = !chatEnabled ? ar ? "المحادثة الشخصية محجوبة حتى توفير مصادقة موثوقة. متاحة في بيئة التطوير المعتمدة فقط." : "Personal chat is blocked until trusted authentication exists. Available only in the approved development environment." : ar ? "اختر ملفك المحلي لبدء المحادثة. معرّف التطوير ليس مصادقة." : "Select your local profile to chat. A development ID is not authentication.";
  const current = (generation: number, signal: AbortSignal) => mounted.current && epoch.current === generation && !signal.aborted && userId === (Number(getUserId()) || null);
  const sendText = async (message: string) => {
    if (locked.current) return;
    if (!canChat || userId !== (Number(getUserId()) || null)) { setError(unavailable); return; }
    const parsed = chatSchema.safeParse({ message });
    if (!parsed.success) { setError(ar ? "اكتب رسالة من 1 إلى 500 حرف." : "Enter a message of 1–500 characters."); return; }
    locked.current = true; const controller = new AbortController(); request.current = controller; const generation = epoch.current;
    const id = `message-${generation}-${++sequence.current}`;
    setError(null); setFailedMessage(null);
    dispatch({ type: "pending", message: { id, role: "user", text: parsed.data.message } });
    try {
      const reply = await sendChatMessage(userId!, parsed.data.message, controller.signal);
      if (!current(generation, controller.signal)) return;
      dispatch({ type: "reply", message: { id: `${id}-reply`, role: "assistant", text: reply.reply, properties: reply.properties, origin: "backend" }, reply, locale });
      setDraft(old => old.trim() === parsed.data.message ? "" : old);
    } catch (reason) {
      if (!current(generation, controller.signal)) return;
      dispatch({ type: "failed" }); setError(chatErrorText(reason, ar)); setFailedMessage(parsed.data.message);
      setDraft(old => old.trim() ? old : parsed.data.message);
    } finally { if (request.current === controller) { request.current = null; locked.current = false; } }
  };
  const send = (action: AssistantAction, label: string) => {
    if (locked.current) return;
    if (action.type !== "open-tool") { void sendText(action.text); return; }
    const id = `local-${epoch.current}-${++sequence.current}`;
    const block: ToolBlock = { type: "tool", id, actionId: id, tool: action.tool, initial: action.initial };
    const checked = assistantToolBlockSchema.safeParse(block); if (!checked.success) return;
    const definition = assistantActionRegistry[block.tool];
    const input = { ...definition.defaults, ...toolDefaults(block.tool, latest.current.selections), ...block.initial };
    dispatch({ type: "local", message: { id, role: "assistant", origin: "frontend", text: label, blocks: [block] }, interaction: { actionId: id, blockId: id, tool: block.tool, input, status: "awaiting_input" } });
  };
  const submitTool = (block: ToolBlock, input: ToolInput, confirmed = false) => {
    if (locked.current || !assistantToolBlockSchema.safeParse(block).success) return;
    const previous = latest.current.interactions[block.id];
    if (!previous || previous.actionId !== block.actionId || previous.tool !== block.tool || previous.status === "completed" || previous.status === "cancelled") return;
    const record: AssistantInteractionState = { ...previous, input, status: "awaiting_input" };
    const definition = assistantActionRegistry[block.tool]; const checked = definition.schema.safeParse(input);
    if (!checked.success) { dispatch({ type: "interaction", value: { ...record, status: "failed", error: ar ? "راجع المدخلات وحدودها." : "Check inputs and their limits.", fieldErrors: Object.fromEntries(checked.error.issues.map(issue => [String(issue.path[0]), ar ? "قيمة غير صالحة" : "Invalid value"])) } }); return; }
    if (definition.confirmation && !confirmed) { dispatch({ type: "interaction", value: { ...record, input: checked.data as ToolInput, confirmation: true } }); return; }
    if (definition.confirmation && (!previous.confirmation || JSON.stringify(previous.input) !== JSON.stringify(checked.data))) return;
    locked.current = true;
    try {
      if (accountData.account.owner !== null && accountData.account.owner !== (Number(getUserId()) || null)) throw new Error(unavailable);
      dispatch({ type: "interaction", value: { ...record, status: "submitting" } });
      const result = applyAssistantSelection(block.tool, checked.data as ToolInput, latest.current.selections, accountData.account, ar);
      dispatch({ type: "selected", selections: result.selections, value: { ...record, input: checked.data as ToolInput, confirmation: false, status: "completed", result: result.result } });
    } catch (reason) { dispatch({ type: "interaction", value: { ...record, status: "failed", error: reason instanceof Error ? reason.message : ar ? "تعذّر تطبيق الاختيار." : "Could not apply selection." } }); }
    finally { locked.current = false; }
  };
  const cancelTool = (block: ToolBlock, input?: ToolInput) => {
    const record = latest.current.interactions[block.id]; if (!record || record.status === "completed" || record.status === "submitting") return;
    dispatch({ type: "interaction", value: { ...record, input: input || record.input, status: "cancelled", confirmation: false } });
  };
  const editTool = (block: ToolBlock) => {
    const record = latest.current.interactions[block.id]; if (!record || locked.current) return;
    dispatch({ type: "interaction", value: { ...record, status: "awaiting_input", confirmation: false } });
  };
  const reset = async (): Promise<boolean> => {
    if (locked.current) return false;
    setClearError(null);
    if (!canChat) {
      // There are no backend turns for a blocked/guest runtime. Clear local inputs only.
      dispatch({ type: "reset" }); setDraft(""); setError(null); setFailedMessage(null); accountData.disconnect(); return true;
    }
    if (userId !== (Number(getUserId()) || null)) return false;
    locked.current = true; setClearing(true); const controller = new AbortController(); request.current = controller; const generation = epoch.current;
    try {
      await clearChatConversation(userId!, controller.signal);
      if (!current(generation, controller.signal)) return false;
      epoch.current++; dispatch({ type: "reset" }); setDraft(""); setError(null); setFailedMessage(null); accountData.disconnect(); return true;
    } catch (reason) { if (current(generation, controller.signal)) setClearError(chatErrorText(reason, ar)); return false; }
    finally { if (request.current === controller) { request.current = null; locked.current = false; if (mounted.current) setClearing(false); } }
  };
  return { state, draft, setDraft, send, reset, submitTool, cancelTool, editTool, canChat, unavailable, error, clearError, clearing, failedMessage, busy: clearing || state.pending || Object.values(state.interactions).some(item => item.status === "submitting") };
}
