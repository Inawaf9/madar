"use client";
import { useState } from "react";
import { useLocalUserId } from "@/features/account/use-local-user-id";
import { useHousing, usePlaces, useSaved, useHome } from "@/features/account/api/hooks";
import type { AccountContext } from "./assistant-interaction-state";

/** Explicit opt-in reads only. Existing keys deduplicate dashboard subscriptions. */
export function useAssistantAccountContext(enabled = false) {
  const userId = useLocalUserId(); const [allowedOwner, setAllowedOwner] = useState<number | null>(null);
  const owner = enabled && userId !== null && allowedOwner === userId ? userId : null;
  const housing = useHousing(owner); const places = usePlaces(owner); const saved = useSaved(owner); const home = useHome(owner);
  const account: AccountContext = { owner, housing: owner ? housing.data || null : null, places: owner ? places.data || [] : [], saved: owner ? saved.data || [] : [], home: owner ? home.data || null : null };
  return { enabled, userId, account, connected: owner !== null, connect: () => { if (enabled && userId) setAllowedOwner(userId); }, disconnect: () => setAllowedOwner(null), housing, places, saved, home };
}
