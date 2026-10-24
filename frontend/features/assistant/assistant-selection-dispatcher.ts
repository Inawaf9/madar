import { assistantActionRegistry, type ToolInput, type ToolName } from "./assistant-action-registry";
import { placeOptions, propertyOptions, type AccountContext, type TemporarySelections, type AssistantActionResult } from "./assistant-interaction-state";

/** Local input collection only. Never execute model prose or simulate API success. */
export function applyAssistantSelection(tool: ToolName, input: ToolInput, previous: TemporarySelections, account: AccountContext, ar: boolean): { selections: TemporarySelections; result: AssistantActionResult } {
  const data = assistantActionRegistry[tool].schema.parse(input) as ToolInput;
  const selections = { ...previous };
  const selectedIds = (key = "ids") => (data[key] || []) as string[];
  const validateIds = (ids: string[], options: { id: string }[]) => {
    if (ids.some(id => !options.some(item => item.id === id))) throw new Error(ar ? "الاختيار لم يعد متاحًا." : "The selection is no longer available.");
  };
  if (["saved-properties", "comparison", "analysis"].includes(tool)) validateIds(selectedIds(), propertyOptions(account, previous, ar));
  if (tool === "destinations" || tool === "commute") validateIds(selectedIds(), placeOptions(account));
  if (tool === "commute" || tool === "services") validateIds(selectedIds("propertyIds"), propertyOptions(account, previous, ar));
  if (tool === "location") selections.location = { latitude: Number(data.latitude), longitude: Number(data.longitude) };
  if (tool === "search") selections.search = { ...data };
  if (tool === "budget" || tool === "specifications") {
    const keys = assistantActionRegistry[tool].fields.map(field => field.name);
    selections.search = { ...Object.fromEntries(Object.entries(previous.search).filter(([key]) => !keys.includes(key))), ...data };
    if (selections.search.purpose === "sale") delete selections.search.rentFrequency;
  }
  if (tool === "interests") selections.interests = data.interests as TemporarySelections["interests"];
  if (tool === "housing") selections.housing = data as TemporarySelections["housing"];
  if (tool === "home") selections.home = data as TemporarySelections["home"];
  if (tool === "weights") selections.weights = data as TemporarySelections["weights"];
  if (tool === "destinations") selections.destinationIds = selectedIds();
  if (tool === "saved-properties" || tool === "analysis") selections.selectedPropertyIds = selectedIds();
  if (tool === "services") selections.selectedPropertyIds = selectedIds("propertyIds");
  if (tool === "comparison") selections.comparisonIds = selectedIds();
  if (tool === "reset-search") selections.search = {};
  return { selections, result: { kind: tool === "comparison" ? "comparison" : tool === "services" ? "services" : tool === "navigation" ? "navigation" : "local", tool, data, summary: tool === "location" ? ar ? "حُدد موقع مؤقت؛ لم يُحفظ ولم يُرسل إلى المحادثة." : "Temporary location selected; not saved or sent to chat." : ar ? "اختيار محلي فقط؛ لم يتغير حسابك ولم تُنفّذ مهمة AI." : "Local selection only; no account change or AI task was executed." } };
}
