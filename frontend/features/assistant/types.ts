import type { ChatProperty } from "@/lib/api/chat";
import type { ToolName, ToolInput } from "./assistant-action-registry";

export type ToolBlock = { type: "tool"; id: string; actionId: string; tool: ToolName; initial?: ToolInput };
export type AssistantAction = { type: "open-tool"; tool: ToolName; initial?: ToolInput } | { type: "text"; text: string };
export type AssistantMessage = { id: string; role: "user" | "assistant"; text: string; origin?: "backend" | "frontend"; properties?: ChatProperty[]; blocks?: ToolBlock[]; error?: boolean };
