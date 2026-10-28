"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Bookmark, Building2, Home, Plus, Search } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskDialog } from "@/components/shared/task-dialog";
import { DataForm } from "@/components/forms/data-form";
import { ErrorState } from "@/components/shared/error-state";
import { QueryFeedback } from "@/components/shared/query-feedback";
import { EmptyState } from "@/components/shared/empty-state";
import { DeleteAction } from "@/components/shared/delete-action";
import { useIdentity } from "@/features/account/identity";
import { useComparisons, useSaved } from "@/features/account/api/query-hooks";
import { invalidateUserData } from "@/features/account/api/invalidation";
import { PropertyDetailPage } from "@/features/properties/detail-page";
import { SavedDetailSkeleton } from "@/features/properties/skeletons";
import { SavedPropertyGrid } from "./saved-property-grid";
import { SavedCardsSkeleton } from "./skeletons";
import { ComparisonPanel } from "./comparison-panel";
import { savedPropertySchema, type SavedProperty } from "@/lib/api/contracts";
import { savedPropertiesApi } from "@/lib/api/saved-properties";

type SortOrder = "newest" | "price-asc" | "price-desc";

const PAGE_SIZE = 6;

function propertyTitle(property: SavedProperty, locale: string) {
  return (
    property.property?.title?.trim() ||
    (locale === "ar" ? property.titleSnapshotAr : property.titleSnapshotEn)?.trim() ||
    property.titleSnapshot?.trim() ||
    (locale === "ar" ? "بيت محفوظ" : "Saved home")
  );
}

function typeName(value: string, t: ReturnType<typeof useTranslations>) {
  const labels: Record<string, string> = {
    apartment: t("typeApartment"),
    villa: t("typeVilla"),
    floor: t("typeFloor"),
    duplex: t("typeDuplex"),
    building: t("typeBuilding"),
    office: t("typeOffice"),
    shop: t("typeShop"),
    warehouse: t("typeWarehouse"),
    land: t("typeLand"),
  };
  return labels[value.toLowerCase()] || value;
}

function SavedPropertiesFilters({
  search,
  onSearchChange,
  propertyType,
  onPropertyTypeChange,
  types,
  sort,
  onSortChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  propertyType: string;
  onPropertyTypeChange: (value: string) => void;
  types: string[];
  sort: SortOrder;
  onSortChange: (value: SortOrder) => void;
}) {
  const t = useTranslations("Workspace");

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-panel sm:p-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label={t("searchShortlist")}
            placeholder={t("searchShortlist")}
            className="h-11 rounded-xl ps-10"
          />
        </div>
        <Select
          value={sort}
          onValueChange={(next) => next && onSortChange(next as SortOrder)}
        >
          <SelectTrigger
            aria-label={t("savedSort")}
            className="h-11 w-full rounded-xl sm:w-52"
          >
            <SelectValue placeholder={t("savedSort")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="newest">{t("savedRecentlySaved")}</SelectItem>
              <SelectItem value="price-asc">{t("savedPriceAscending")}</SelectItem>
              <SelectItem value="price-desc">{t("savedPriceDescending")}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div
        role="group"
        aria-label={t("savedPropertyTypes")}
        className="flex flex-wrap gap-2 border-t border-border/60 pt-3"
      >
        <Button
          type="button"
          size="sm"
          variant={propertyType === "" ? "secondary" : "outline"}
          aria-pressed={propertyType === ""}
          className="min-h-9 rounded-full"
          onClick={() => onPropertyTypeChange("")}
        >
          <Home data-icon="inline-start" />
          {t("savedAllTypes")}
        </Button>
        {types.map((type) => (
          <Button
            key={type}
            type="button"
            size="sm"
            variant={propertyType === type ? "secondary" : "outline"}
            aria-pressed={propertyType === type}
            className="min-h-9 rounded-full"
            onClick={() => onPropertyTypeChange(type)}
          >
            {type.toLowerCase() === "villa" ? (
              <Home data-icon="inline-start" />
            ) : (
              <Building2 data-icon="inline-start" />
            )}
            {typeName(type, t)}
          </Button>
        ))}
      </div>
    </section>
  );
}

function SavedPropertiesEmpty({ filtered }: { filtered: boolean }) {
  const t = useTranslations("Workspace");
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/70 px-6 py-10 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-secondary text-primary">
        <Bookmark
          aria-hidden="true"
          className="size-7"
        />
      </span>
      <h3 className="mt-4 text-lg font-medium">
        {t(filtered ? "noMatches" : "noSaved")}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {t(filtered ? "noMatchesHint" : "noSavedHint")}
      </p>
      {!filtered ? (
        <Button
          nativeButton={false}
          render={<Link href="/properties" />}
          className="mt-5 rounded-xl"
        >
          <Search data-icon="inline-start" />
          {t("dashboardExplore")}
        </Button>
      ) : null}
    </div>
  );
}

export function SavedPage() {
  const t = useTranslations("Workspace");
  const locale = useLocale();
  const { userId } = useIdentity();
  const cache = useQueryClient();
  const saved = useSaved(userId);
  const comparisons = useComparisons(userId);

  const [search, setSearch] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [page, setPage] = useState(0);
  const [addReferenceOpen, setAddReferenceOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedIdsState, setSelectedIds] = useState<number[]>([]);
  const properties = useMemo(() => saved.data ?? [], [saved.data]);
  const savedIds = useMemo(
    () => new Set(properties.map((property) => property.id)),
    [properties],
  );
  const selectedIds = selectedIdsState.filter((id) => savedIds.has(id));

  const availableTypes = useMemo(
    () =>
      Array.from(
        new Set(
          properties
            .map((property) => property.property?.propertyType?.trim())
            .filter((type): type is string => !!type),
        ),
      ).sort((first, second) => first.localeCompare(second, locale)),
    [properties, locale],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase(locale);
    const matches = properties.filter((property) => {
      const listing = property.property;
      const matchesType =
        !propertyType ||
        listing?.propertyType?.toLowerCase() === propertyType.toLowerCase();
      const matchesSearch = [
        property.titleSnapshot,
        listing?.titleAr,
        listing?.titleEn,
        propertyTitle(property, locale),
        property.source,
        property.externalPropertyId,
        listing?.cityName,
        listing?.city,
        listing?.neighborhood,
        listing?.propertyType,
      ].some((value) => value?.toLocaleLowerCase(locale).includes(term));
      return matchesType && matchesSearch;
    });

    return [...matches].sort((first, second) => {
      if (sort === "price-asc" || sort === "price-desc") {
        const firstPrice = first.property?.price;
        const secondPrice = second.property?.price;
        if (firstPrice == null && secondPrice == null) return 0;
        if (firstPrice == null) return 1;
        if (secondPrice == null) return -1;
        return sort === "price-asc" ? firstPrice - secondPrice : secondPrice - firstPrice;
      }

      const firstDate = Date.parse(first.savedAt || "");
      const secondDate = Date.parse(second.savedAt || "");
      const firstTimestamp = Number.isFinite(firstDate) ? firstDate : 0;
      const secondTimestamp = Number.isFinite(secondDate) ? secondDate : 0;
      return secondTimestamp - firstTimestamp;
    });
  }, [locale, properties, propertyType, search, sort]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageIndex = Math.min(page, Math.max(0, totalPages - 1));
  const visible = filtered.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE);

  function updateSearch(value: string) {
    setSearch(value);
    setPage(0);
  }

  function updateType(value: string) {
    setPropertyType(value);
    setPage(0);
  }

  function toggleSelected(id: number) {
    const property = properties.find((item) => item.id === id);
    if (!property || property.available === false) return;

    setSelectedIds((current) => {
      const active = current.filter((selectedId) => savedIds.has(selectedId));
      if (active.includes(id)) return active.filter((selectedId) => selectedId !== id);
      if (active.length >= 2) return active;
      const duplicate = active.some((selectedId) =>
        properties.some(
          (item) =>
            item.id === selectedId &&
            item.source.toUpperCase() === property.source.toUpperCase() &&
            item.externalPropertyId === property.externalPropertyId,
        ),
      );
      return duplicate ? active : [...active, id];
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-5 pb-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
            <Bookmark
              aria-hidden="true"
              className="size-6"
            />
          </span>
          <div>
            <h1 className="text-page font-medium tracking-tight">{t("savedTitle")}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t("savedIntro")}
            </p>
            {!saved.isPending && !saved.isError ? (
              <p className="mt-2 text-xs font-medium text-primary">
                {new Intl.NumberFormat(locale).format(properties.length)}{" "}
                {t("savedCountLabel")}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-10 rounded-xl"
            onClick={() => setAddReferenceOpen(true)}
          >
            <Plus data-icon="inline-start" />
            {t("addProperty")}
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/properties" />}
            className="h-10 rounded-xl"
          >
            <Search data-icon="inline-start" />
            {t("dashboardExplore")}
          </Button>
        </div>
      </header>

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(18rem,3fr)]">
        <main className="flex min-w-0 flex-col gap-4">
          <SavedPropertiesFilters
            search={search}
            onSearchChange={updateSearch}
            propertyType={propertyType}
            onPropertyTypeChange={updateType}
            types={availableTypes}
            sort={sort}
            onSortChange={(next) => {
              setSort(next);
              setPage(0);
            }}
          />

          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <h2 className="text-base font-medium">{t("savedGridTitle")}</h2>
            {!saved.isPending && !saved.isError ? (
              <span className="text-sm text-muted-foreground">
                {new Intl.NumberFormat(locale).format(filtered.length)}{" "}
                {t("savedResultLabel")}
              </span>
            ) : null}
          </div>

          <QueryFeedback query={saved} />
          {saved.isPending ? (
            <SavedCardsSkeleton className="@min-[44rem]/saved-skeleton:grid-cols-2" />
          ) : saved.isError && !saved.data ? (
            <ErrorState
              error={saved.error}
              retry={() => void saved.refetch()}
            />
          ) : properties.length === 0 ? (
            <SavedPropertiesEmpty filtered={false} />
          ) : filtered.length === 0 ? (
            <SavedPropertiesEmpty filtered />
          ) : (
            <SavedPropertyGrid
              properties={visible}
              selectedIds={selectedIds}
              onToggleSelected={toggleSelected}
              onRemoved={(id) =>
                setSelectedIds((current) => current.filter((value) => value !== id))
              }
            />
          )}

          {totalPages > 1 ? (
            <nav
              aria-label={t("savedPagination")}
              className="flex items-center justify-between gap-3 pt-2"
            >
              <Button
                type="button"
                variant="outline"
                disabled={pageIndex === 0}
                onClick={() => setPage(pageIndex - 1)}
              >
                {t("previousPage")}
              </Button>
              <span className="text-sm tabular-nums text-muted-foreground">
                {new Intl.NumberFormat(locale).format(pageIndex + 1)} /{" "}
                {new Intl.NumberFormat(locale).format(totalPages)}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={pageIndex + 1 >= totalPages}
                onClick={() => setPage(pageIndex + 1)}
              >
                {t("nextPage")}
              </Button>
            </nav>
          ) : null}
        </main>

        <ComparisonPanel
          properties={properties}
          comparisons={comparisons.data ?? []}
          selectedIds={selectedIds}
          loading={saved.isPending || comparisons.isPending}
          error={
            saved.isError && !saved.data
              ? saved.error
              : comparisons.isError
                ? comparisons.error
                : undefined
          }
          retry={() => {
            if (saved.isError) void saved.refetch();
            if (comparisons.isError) void comparisons.refetch();
          }}
          onRemove={(id) =>
            setSelectedIds((current) => current.filter((value) => value !== id))
          }
        />
      </div>

      <TaskDialog
        open={addReferenceOpen}
        onOpenChange={setAddReferenceOpen}
        busy={busy}
        title={t("addProperty")}
        description={t("referenceHint")}
      >
        <DataForm
          schema={savedPropertySchema}
          defaults={{ externalPropertyId: "", source: "" }}
          fields={[
            { name: "source", maxLength: 50 },
            { name: "externalPropertyId", maxLength: 150 },
          ]}
          onCancel={() => setAddReferenceOpen(false)}
          onSubmit={async (value) => {
            setBusy(true);
            try {
              await savedPropertiesApi.add(value);
              await invalidateUserData(cache, userId);
              setAddReferenceOpen(false);
            } finally {
              setBusy(false);
            }
          }}
        />
      </TaskDialog>
    </div>
  );
}

export function SavedDetail({ id }: { id: number }) {
  const t = useTranslations("Workspace");
  const { userId } = useIdentity();
  const query = useSaved(userId);
  const cache = useQueryClient();

  if (query.isPending) return <SavedDetailSkeleton />;
  if (query.isError && !query.data?.length)
    return (
      <ErrorState
        error={query.error}
        retry={() => void query.refetch()}
      />
    );

  const property = query.data?.find((item) => item.id === id);
  if (!property)
    return (
      <EmptyState
        title={t("PropertyMissing")}
        description={t("PropertyMissingHint")}
      >
        <Button
          nativeButton={false}
          render={<Link href="/saved" />}
        >
          {t("saved")}
        </Button>
      </EmptyState>
    );

  return (
    <>
      <QueryFeedback query={query} />
      <nav
        className="mb-4"
        aria-label={t("navigation")}
      >
        <Link
          href="/saved"
          className="inline-flex min-h-11 items-center rounded-lg text-sm text-primary underline"
        >
          {t("saved")}
        </Link>
      </nav>
      <PropertyDetailPage
        source={property.source}
        externalId={property.externalPropertyId}
      />
      <details className="mt-6 rounded-xl border border-border/60 p-4">
        <summary className="cursor-pointer text-sm font-medium">
          {t("savedReference")}
        </summary>
        <dl className="my-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">{t("fields.source")}</dt>
            <dd className="mt-1 break-all">{property.source}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("fields.externalPropertyId")}
            </dt>
            <dd className="mt-1 break-all">{property.externalPropertyId}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button
            nativeButton={false}
            render={<Link href={`/compare?first=${property.id}`} />}
            variant="outline"
          >
            {t("compare")}
          </Button>
          <DeleteAction
            onDelete={async () => {
              await savedPropertiesApi.remove(id);
              await invalidateUserData(cache, userId);
            }}
          />
        </div>
      </details>
    </>
  );
}
