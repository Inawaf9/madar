"use client";
import { createContext, useContext } from "react";
import type { useAssistantConversation } from "./hooks/use-assistant-conversation";
import type { useAssistantAccountContext } from "./assistant-account-context";

type AssistantContextValue = ReturnType<typeof useAssistantConversation> & {
  open: boolean;
  setOpen: (value: boolean) => void;
  accountData: ReturnType<typeof useAssistantAccountContext>;
};
export const AssistantContext = createContext<AssistantContextValue | null>(null);
export function useAssistant() {
  const value = useContext(AssistantContext);
  if (!value) throw new Error("AssistantProvider is required");
  return value;
}
