"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { chatSchema } from "@/lib/api/chat";
import {
  sendChatMessage,
  clearChatConversation,
  chatErrorText,
  type ChatReply,
} from "@/lib/api/chat";
import { getUserId } from "@/lib/user-id";
import { assistantActionRegistry, type ToolInput } from "../assistant-action-registry";
import { assistantToolBlockSchema } from "../assistant-action-schemas";
import {
  emptySelections,
  toolDefaults,
  type AssistantInteractionState,
  type TemporarySelections,
} from "../assistant-interaction-state";
import { applyAssistantSelection } from "../assistant-selection-dispatcher";
import { adaptChatProperty } from "../chat-property-adapter";
import type { useAssistantAccountContext } from "../assistant-account-context";
import type { AssistantAction, AssistantMessage, ToolBlock } from "../types";

type Conversation = {
  messages: AssistantMessage[];
  revision: number;
  pending: boolean;
  clearing: boolean;
  failure: unknown | null;
  clearFailure: unknown | null;
  failedMessage: string | null;
  selections: TemporarySelections;
  interactions: Record<string, AssistantInteractionState>;
};
const initial = (): Conversation => ({
  messages: [],
  revision: 0,
  pending: false,
  clearing: false,
  failure: null,
  clearFailure: null,
  failedMessage: null,
  selections: emptySelections(),
  interactions: {},
});
const guestState = initial();
type Event =
  | { type: "pending"; message: AssistantMessage }
  | { type: "reply"; message: AssistantMessage; reply: ChatReply; locale: string }
  | { type: "failed"; reason: unknown; message: string }
  | { type: "clearing"; value: boolean }
  | { type: "clear-failed"; reason: unknown }
  | { type: "local"; message: AssistantMessage; interaction: AssistantInteractionState }
  | { type: "interaction"; value: AssistantInteractionState }
  | {
      type: "selected";
      selections: TemporarySelections;
      value: AssistantInteractionState;
    }
  | { type: "reset" };
function reducer(state: Conversation, event: Event): Conversation {
  switch (event.type) {
    case "pending":
      return {
        ...state,
        pending: true,
        failure: null,
        failedMessage: null,
        messages: [...state.messages, event.message],
      };
    case "reply":
      return {
        ...state,
        pending: false,
        messages: [...state.messages, event.message],
        selections: {
          ...state.selections,
          references: [
            ...state.selections.references,
            ...event.reply.properties.flatMap((dto, index) => {
              const { property, listing } = adaptChatProperty(dto, event.locale);
              return property
                ? [
                    {
                      id: `chat:${event.message.id}:${index}`,
                      origin: "chat" as const,
                      title: listing.title,
                      listing: property,
                      source: property.source,
                      externalId: property.externalId!,
                    },
                  ]
                : [];
            }),
          ],
        },
      };
    case "failed":
      return {
        ...state,
        pending: false,
        failure: event.reason,
        failedMessage: event.message,
      };
    case "clearing":
      return {
        ...state,
        clearing: event.value,
        clearFailure: event.value ? null : state.clearFailure,
      };
    case "clear-failed":
      return { ...state, clearFailure: event.reason };
    case "local":
      return {
        ...state,
        messages: [...state.messages, event.message],
        interactions: {
          ...state.interactions,
          [event.interaction.blockId]: event.interaction,
        },
      };
    case "interaction":
      return {
        ...state,
        interactions: { ...state.interactions, [event.value.blockId]: event.value },
      };
    case "selected":
      return {
        ...state,
        selections: event.selections,
        interactions: { ...state.interactions, [event.value.blockId]: event.value },
      };
    case "reset":
      return { ...initial(), revision: state.revision + 1 };
  }
}

type Store = {
  state: Conversation;
  listeners: Set<() => void>;
  controller: AbortController | null;
  locked: boolean;
  epoch: number;
  sequence: number;
};
const stores = new Map<number, Store>();
const openByUser = new Map<number, boolean>();
export function assistantOpenFor(userId: number | null) {
  return userId !== null && openByUser.get(userId) === true;
}
export function setAssistantOpenFor(userId: number | null, open: boolean) {
  if (userId !== null) openByUser.set(userId, open);
}
function storeFor(userId: number): Store {
  let store = stores.get(userId);
  if (!store) {
    store = {
      state: initial(),
      listeners: new Set(),
      controller: null,
      locked: false,
      epoch: 0,
      sequence: 0,
    };
    stores.set(userId, store);
  }
  return store;
}
function emit(store: Store) {
  store.listeners.forEach((listener) => listener());
}
function dispatch(store: Store, event: Event) {
  store.state = reducer(store.state, event);
  emit(store);
}
function subscribeConversation(userId: number | null, listener: () => void) {
  if (userId === null) return () => {};
  const store = storeFor(userId);
  store.listeners.add(listener);
  return () => {
    store.listeners.delete(listener);
  };
}
function conversationSnapshot(userId: number | null) {
  return userId === null ? guestState : storeFor(userId).state;
}
export function clearAssistantConversationsExcept(userId: number | null) {
  for (const [owner, store] of stores)
    if (owner !== userId) {
      store.controller?.abort();
      stores.delete(owner);
    }
  for (const owner of openByUser.keys()) if (owner !== userId) openByUser.delete(owner);
}

export function useAssistantConversation({
  userId,
  chatEnabled,
  locale,
  accountData,
}: {
  userId: number | null;
  chatEnabled: boolean;
  locale: string;
  accountData: ReturnType<typeof useAssistantAccountContext>;
}) {
  const ar = locale === "ar";
  const store = userId === null ? null : storeFor(userId);
  const state = useSyncExternalStore(
    (listener) => subscribeConversation(userId, listener),
    () => conversationSnapshot(userId),
    () => guestState,
  );
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const canChat = chatEnabled && userId !== null;
  const unavailable = ar
    ? "سجّل الدخول لاستخدام المحادثة الشخصية."
    : "Sign in to use personal chat.";
  const current = (generation: number, signal: AbortSignal) =>
    !!store &&
    stores.get(userId!) === store &&
    store.epoch === generation &&
    !signal.aborted &&
    userId === (Number(getUserId()) || null);
  const sendText = async (message: string) => {
    if (!store || store.locked) return;
    if (!canChat || userId !== (Number(getUserId()) || null)) {
      setError(unavailable);
      return;
    }
    const parsed = chatSchema.safeParse({ message });
    if (!parsed.success) {
      setError(
        ar ? "اكتب رسالة من 1 إلى 500 حرف." : "Enter a message of 1 to 500 characters.",
      );
      return;
    }
    store.locked = true;
    const controller = new AbortController();
    store.controller = controller;
    const generation = store.epoch;
    const id = `message-${generation}-${++store.sequence}`;
    setError(null);
    dispatch(store, {
      type: "pending",
      message: { id, role: "user", text: parsed.data.message },
    });
    try {
      const reply = await sendChatMessage(parsed.data.message, controller.signal);
      if (!current(generation, controller.signal)) return;
      dispatch(store, {
        type: "reply",
        message: {
          id: `${id}-reply`,
          role: "assistant",
          text: reply.reply,
          properties: reply.properties,
          origin: "backend",
        },
        reply,
        locale,
      });
      if (mounted.current)
        setDraft((old) => (old.trim() === parsed.data.message ? "" : old));
    } catch (reason) {
      if (!current(generation, controller.signal)) return;
      dispatch(store, { type: "failed", reason, message: parsed.data.message });
      if (mounted.current) setDraft((old) => (old.trim() ? old : parsed.data.message));
    } finally {
      if (store.controller === controller) {
        store.controller = null;
        store.locked = false;
      }
    }
  };
  const send = (action: AssistantAction, label: string) => {
    if (!store || store.locked) return;
    if (action.type !== "open-tool") {
      void sendText(action.text);
      return;
    }
    const id = `local-${store.epoch}-${++store.sequence}`;
    const block: ToolBlock = {
      type: "tool",
      id,
      actionId: id,
      tool: action.tool,
      initial: action.initial,
    };
    const checked = assistantToolBlockSchema.safeParse(block);
    if (!checked.success) return;
    const definition = assistantActionRegistry[block.tool];
    const input = {
      ...definition.defaults,
      ...toolDefaults(block.tool, latest.current.selections),
      ...block.initial,
    };
    dispatch(store, {
      type: "local",
      message: {
        id,
        role: "assistant",
        origin: "frontend",
        text: label,
        blocks: [block],
      },
      interaction: {
        actionId: id,
        blockId: id,
        tool: block.tool,
        input,
        status: "awaiting_input",
      },
    });
  };
  const submitTool = (block: ToolBlock, input: ToolInput, confirmed = false) => {
    if (!store || store.locked || !assistantToolBlockSchema.safeParse(block).success)
      return;
    const previous = latest.current.interactions[block.id];
    if (
      !previous ||
      previous.actionId !== block.actionId ||
      previous.tool !== block.tool ||
      previous.status === "completed" ||
      previous.status === "cancelled"
    )
      return;
    const record: AssistantInteractionState = {
      ...previous,
      input,
      status: "awaiting_input",
    };
    const definition = assistantActionRegistry[block.tool];
    const checked = definition.schema.safeParse(input);
    if (!checked.success) {
      dispatch(store, {
        type: "interaction",
        value: {
          ...record,
          status: "failed",
          error: ar ? "راجع المدخلات وحدودها." : "Check inputs and their limits.",
          fieldErrors: Object.fromEntries(
            checked.error.issues.map((issue) => [
              String(issue.path[0]),
              ar ? "قيمة غير صالحة" : "Invalid value",
            ]),
          ),
        },
      });
      return;
    }
    if (definition.confirmation && !confirmed) {
      dispatch(store, {
        type: "interaction",
        value: { ...record, input: checked.data as ToolInput, confirmation: true },
      });
      return;
    }
    if (
      definition.confirmation &&
      (!previous.confirmation ||
        JSON.stringify(previous.input) !== JSON.stringify(checked.data))
    )
      return;
    store.locked = true;
    try {
      if (
        accountData.account.owner !== null &&
        accountData.account.owner !== (Number(getUserId()) || null)
      )
        throw new Error(unavailable);
      dispatch(store, {
        type: "interaction",
        value: { ...record, status: "submitting" },
      });
      const result = applyAssistantSelection(
        block.tool,
        checked.data as ToolInput,
        latest.current.selections,
        accountData.account,
        ar,
      );
      dispatch(store, {
        type: "selected",
        selections: result.selections,
        value: {
          ...record,
          input: checked.data as ToolInput,
          confirmation: false,
          status: "completed",
          result: result.result,
        },
      });
    } catch (reason) {
      dispatch(store, {
        type: "interaction",
        value: {
          ...record,
          status: "failed",
          error:
            reason instanceof Error
              ? reason.message
              : ar
                ? "تعذّر تطبيق الاختيار."
                : "Could not apply selection.",
        },
      });
    } finally {
      store.locked = false;
    }
  };
  const cancelTool = (block: ToolBlock, input?: ToolInput) => {
    const record = latest.current.interactions[block.id];
    if (!record || record.status === "completed" || record.status === "submitting")
      return;
    if (store)
      dispatch(store, {
        type: "interaction",
        value: {
          ...record,
          input: input || record.input,
          status: "cancelled",
          confirmation: false,
        },
      });
  };
  const editTool = (block: ToolBlock) => {
    const record = latest.current.interactions[block.id];
    if (!record || !store || store.locked) return;
    dispatch(store, {
      type: "interaction",
      value: { ...record, status: "awaiting_input", confirmation: false },
    });
  };
  const reset = async (): Promise<boolean> => {
    if (!canChat) {
      setDraft("");
      setError(null);
      accountData.disconnect();
      return true;
    }
    if (!store || store.locked) return false;
    if (userId !== (Number(getUserId()) || null)) return false;
    store.locked = true;
    dispatch(store, { type: "clearing", value: true });
    const controller = new AbortController();
    store.controller = controller;
    const generation = store.epoch;
    try {
      await clearChatConversation(controller.signal);
      if (!current(generation, controller.signal)) return false;
      store.epoch++;
      dispatch(store, { type: "reset" });
      if (mounted.current) {
        setDraft("");
        setError(null);
        accountData.disconnect();
      }
      return true;
    } catch (reason) {
      if (current(generation, controller.signal))
        dispatch(store, { type: "clear-failed", reason });
      return false;
    } finally {
      if (store.controller === controller) {
        store.controller = null;
        store.locked = false;
        dispatch(store, { type: "clearing", value: false });
      }
    }
  };
  return {
    state,
    draft,
    setDraft,
    send,
    reset,
    submitTool,
    cancelTool,
    editTool,
    canChat,
    unavailable,
    error: error ?? (state.failure ? chatErrorText(state.failure, ar) : null),
    clearError: state.clearFailure ? chatErrorText(state.clearFailure, ar) : null,
    clearing: state.clearing,
    failedMessage: state.failedMessage,
    busy:
      state.clearing ||
      state.pending ||
      Object.values(state.interactions).some((item) => item.status === "submitting"),
  };
}
