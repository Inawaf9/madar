import type {
  CurrentHome,
  CurrentHomeInput,
  HousingPreference,
  HousingPreferenceInput,
  PlacePreference,
  SavedProperty,
} from "@/lib/api/contracts";
import type { Property, SearchFilters, categories } from "@/lib/api/discovery-contracts";
import type { RecommendationWeights } from "@/lib/api/insight-contracts";
import type { InteractionStatus, ToolInput, ToolName } from "./assistant-action-registry";

export type AssistantPlace = {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  importance: number;
  visitPerWeek: number;
  origin: "account";
};
export type AssistantPropertyRef = {
  id: string;
  title: string;
  origin: "account" | "chat";
  listing?: Property;
  source?: string;
  externalId?: string;
  savedId?: number;
};
export type AccountContext = {
  owner: number | null;
  places: PlacePreference[];
  saved: SavedProperty[];
  housing: HousingPreference | null;
  home: CurrentHome | null;
};
export type TemporarySelections = {
  search: Partial<SearchFilters>;
  location: { latitude: number; longitude: number } | null;
  interests: (typeof categories)[number][];
  references: AssistantPropertyRef[];
  comparisonIds: string[];
  destinationIds: string[];
  selectedPropertyIds: string[];
  housing: HousingPreferenceInput | null;
  home: CurrentHomeInput | null;
  weights: RecommendationWeights | null;
};
export const emptySelections = (): TemporarySelections => ({
  search: {},
  location: null,
  interests: [],
  references: [],
  comparisonIds: [],
  destinationIds: [],
  selectedPropertyIds: [],
  housing: null,
  home: null,
  weights: null,
});
export type AssistantActionResult = {
  summary: string;
  tool?: ToolName;
  kind: "local" | "comparison" | "services" | "navigation";
  data?: ToolInput;
};
export type AssistantInteractionState = {
  actionId: string;
  blockId: string;
  tool: ToolName;
  status: InteractionStatus;
  input: ToolInput;
  confirmation?: boolean;
  result?: AssistantActionResult;
  error?: string;
  fieldErrors?: Record<string, string>;
};
export function propertyOptions(
  account: AccountContext,
  selections: TemporarySelections,
  ar: boolean,
): AssistantPropertyRef[] {
  const saved = account.saved
    .filter((item) => item.id != null)
    .map((item) => ({
      id: `account:property:${item.id}`,
      title: item.titleSnapshot || (ar ? "بيت محفوظ" : "Saved home"),
      origin: "account" as const,
      source: item.source,
      externalId: item.externalPropertyId,
      savedId: item.id!,
    }));
  return [...selections.references, ...saved];
}
export function placeOptions(account: AccountContext): AssistantPlace[] {
  return account.places
    .filter((item) => item.id != null)
    .map((item) => ({
      ...item,
      id: `account:place:${item.id}`,
      origin: "account" as const,
    }));
}
export function toolDefaults(tool: ToolName, selections: TemporarySelections): ToolInput {
  if (tool === "search" || tool === "budget" || tool === "specifications")
    return { ...selections.search };
  if (tool === "location") return selections.location ? { ...selections.location } : {};
  if (tool === "housing") return selections.housing ? { ...selections.housing } : {};
  if (tool === "home") return selections.home ? { ...selections.home } : {};
  if (tool === "weights") return selections.weights ? { ...selections.weights } : {};
  if (tool === "analysis") return { ids: selections.selectedPropertyIds.slice(0, 1) };
  if (tool === "interests") return { interests: selections.interests };
  if (tool === "destinations") return { ids: selections.destinationIds };
  if (tool === "comparison") return { ids: selections.comparisonIds };
  if (tool === "saved-properties") return { ids: selections.selectedPropertyIds };
  if (tool === "commute")
    return {
      ids: selections.destinationIds,
      propertyIds: selections.selectedPropertyIds.slice(0, 1),
    };
  return {};
}
