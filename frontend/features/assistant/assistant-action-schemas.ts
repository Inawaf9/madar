import { z } from "zod";
import { toolNames } from "./assistant-action-registry";

export const assistantToolBlockSchema = z.object({ type: z.literal("tool"), id: z.string().min(1).max(200), actionId: z.string().min(1).max(200), tool: z.enum(toolNames), initial: z.record(z.string(), z.unknown()).optional() }).strict();
