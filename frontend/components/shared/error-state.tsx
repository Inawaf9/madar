"use client";

import { useTranslations } from "next-intl";

import { CircleAlert } from "lucide-react";

import { ApiError, getUserFacingApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export const businessErrors: Record<string, string> = {
  "Login endpoint missing": "loginGap",
  "Email is already registered": "emailTaken", "Email is already used by another account": "emailTaken",
  "User not found": "userMissing", "User Not Found": "userMissing",
  "This property is already in your saved list": "duplicateSaved", "This comparison already exists": "duplicateComparison",
  "Cannot compare a property with itself": "sameProperty", "User already has a current home": "duplicateHome",
  "User already has housing preferences": "duplicatePreference",
  "No properties found for recommendation": "noRecommendationCandidates",
  "No properties have sufficient data for matching": "insufficientMatchingData",
  "Property has insufficient data for matching": "insufficientMatchingData",
  "Housing budget is invalid": "housingSetupRequired",
  "AI is unavailable right now": "providerUnavailable",
  "Housing preferences not found": "housingSetupRequired", "Housing preference not found": "housingSetupRequired",
  "Property price is unavailable": "propertyPriceUnavailable",
  "Neighborhood suitability data is unavailable": "neighborhoodUnavailable",
  "Occupants count is required": "occupantsRequired", "Occupants count must be at least 1": "occupantsRequired",
};
export function useErrorText() {
  const t = useTranslations("Workspace");
  return (error: unknown) => t(error instanceof ApiError && error.backendMessage && businessErrors[error.backendMessage] ? businessErrors[error.backendMessage] : getUserFacingApiError(error));
}
export function ErrorState({ error, retry, retryDisabled = false }: { error: unknown; retry?: () => void; retryDisabled?: boolean }) {
  const t = useTranslations("Workspace"); const message = useErrorText();
  return <Alert variant="destructive" className="rounded-xl"><CircleAlert aria-hidden="true" /><AlertTitle>{t("errorTitle")}</AlertTitle><AlertDescription>{message(error)}{retry ? <Button type="button" variant="outline" size="sm" disabled={retryDisabled} onClick={retry}>{t("retry")}</Button> : null}</AlertDescription></Alert>;
}
