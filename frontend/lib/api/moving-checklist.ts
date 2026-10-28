import type { ApiResponse } from "./contracts";
import { apiRequest } from "./client";

export type MovingTask = {
  id: number;
  title: string;
  source: "FIXED" | "AI";
  done: boolean;
};

export type MovingChecklist = {
  done: number;
  total: number;
  movingTasks: MovingTask[];
  note: string | null;
  ownerChecks: MovingTask[];
};

export const movingChecklistApi = {
  get: (language: "ar" | "en", signal?: AbortSignal) =>
    apiRequest<MovingChecklist>(`/api/v1/moving-checklist/get?lang=${language}`, {
      signal,
    }),
  generate: () =>
    apiRequest<ApiResponse>("/api/v1/moving-checklist/generate", { method: "POST" }),
  toggle: (taskId: number) =>
    apiRequest<ApiResponse>(`/api/v1/moving-checklist/toggle/${taskId}`, {
      method: "PUT",
    }),
  reset: () =>
    apiRequest<ApiResponse>("/api/v1/moving-checklist/reset", { method: "DELETE" }),
};
