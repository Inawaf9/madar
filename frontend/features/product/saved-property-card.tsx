"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight, Columns3, MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { SavedProperty } from "@/lib/api/contracts";
import type { Property } from "@/lib/api/discovery-contracts";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { PropertyCardView } from "@/components/property/property-card-view";
import { propertyCardData } from "@/lib/property-card";
import { ErrorState } from "@/components/shared/error-state";

// Presentation only: the grid owns detail requests and saved-property mutations.
export function SavedPropertyCard({ property, listing, loading, detailsFailed, refreshing, onRetry, onRemove }: {
  property: SavedProperty; listing?: Property; loading: boolean; detailsFailed: boolean; refreshing: boolean; onRetry: () => void; onRemove: () => Promise<unknown>;
}) {
  const locale = useLocale(); const ar = locale === "ar"; const t = useTranslations("Workspace"); const actionsTrigger = useRef<HTMLButtonElement>(null);
  const [removeOpen, setRemoveOpen] = useState(false); const [removing, setRemoving] = useState(false); const [removeError, setRemoveError] = useState<unknown>();
  const title = listing?.title?.trim() || property.titleSnapshot?.trim() || t("untitledProperty");
  const href = `/properties/${property.id}`;
  const model = propertyCardData(listing, title);
  return <><PropertyCardView listing={model} href={href} loading={loading && !listing}
    overlayActions={<DropdownMenu><DropdownMenuTrigger render={<Button ref={actionsTrigger} size="icon" variant="secondary" className="size-11 rounded-full shadow-sm" />} aria-label={ar ? `خيارات ${title}` : `Actions for ${title}`}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-2rem)] motion-reduce:animate-none"><DropdownMenuGroup><DropdownMenuLabel className="truncate">{title}</DropdownMenuLabel><DropdownMenuItem className="min-h-11" render={<Link href={`/compare?first=${property.id}`} />}><Columns3 />{t("compare")}</DropdownMenuItem><DropdownMenuItem className="min-h-11" disabled={refreshing} onClick={onRetry}><RefreshCw />{ar ? "تحديث بيانات العقار" : "Refresh listing"}</DropdownMenuItem><DropdownMenuItem className="min-h-11" variant="destructive" onClick={() => { setRemoveError(undefined); setRemoveOpen(true); }}><Trash2 />{ar ? "إزالة من المحفوظات" : "Remove from saved"}</DropdownMenuItem></DropdownMenuGroup><dl className="flex flex-col gap-1 border-t border-border/50 px-2 py-3 text-xs text-muted-foreground"><div className="flex gap-2"><dt>{ar ? "المصدر" : "Source"}</dt><dd className="min-w-0 break-all"><bdi>{property.source}</bdi></dd></div><div className="flex gap-2"><dt>{ar ? "المرجع" : "Reference"}</dt><dd className="min-w-0 break-all"><bdi>{property.externalPropertyId}</bdi></dd></div>{property.savedAt && !Number.isNaN(Date.parse(property.savedAt)) ? <div><dt className="sr-only">{ar ? "تاريخ الحفظ" : "Saved on"}</dt><dd>{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(property.savedAt))}</dd></div> : null}</dl></DropdownMenuContent></DropdownMenu>}
    status={detailsFailed ? <div role="status" className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground"><span>{ar ? "تعذّر تحديث تفاصيل الإعلان." : "Listing details could not be refreshed."}</span><Button variant="ghost" size="sm" disabled={refreshing} onClick={onRetry}>{ar ? "إعادة المحاولة" : "Retry"}</Button></div> : null}
    footer={<Button nativeButton={false} render={<Link href={href} />} variant="outline" className="w-full justify-between">{ar ? "عرض العقار" : "View property"}<ArrowUpRight data-icon="inline-end" className="rtl:-scale-x-100" /></Button>} />
    <AlertDialog open={removeOpen} onOpenChange={value => { if (!removing) setRemoveOpen(value); }}><AlertDialogContent finalFocus={actionsTrigger} dir={ar ? "rtl" : "ltr"} className="max-w-[calc(100vw-2rem)] sm:max-w-md"><AlertDialogHeader><AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle><AlertDialogDescription>{ar ? `إزالة «${title}» من قائمتك المحفوظة؟` : `Remove “${title}” from your saved properties?`}</AlertDialogDescription></AlertDialogHeader>{removeError ? <ErrorState error={removeError} /> : null}<AlertDialogFooter><AlertDialogCancel disabled={removing}>{t("cancel")}</AlertDialogCancel><Button variant="destructive" disabled={removing} aria-busy={removing} onClick={async () => { setRemoving(true); setRemoveError(undefined); try { await onRemove(); setRemoveOpen(false); } catch (error) { setRemoveError(error); } finally { setRemoving(false); } }}>{removing ? t("working") : t("remove")}</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>;
}
