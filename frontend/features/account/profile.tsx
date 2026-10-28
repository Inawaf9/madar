"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, SlidersHorizontal, UserRound } from "lucide-react";
import { ChangePasswordForm } from "@/features/auth/change-password-form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { profileApi } from "@/lib/api/account";
import { useIdentity } from "@/features/account/identity";
import { DeleteAction } from "@/components/shared/delete-action";
import { Panel } from "@/components/shared/panel";
import { PageHeading } from "@/components/shared/page-heading";
import { ProfileCompletionPanel } from "./profile-completion";
import { HomePanel } from "./current-home-panel";
import { HousingPanel } from "./housing-preferences-panel";
import { ErrorState } from "@/components/shared/error-state";
import { keys } from "./api/query-hooks";

function AccountSettings() {
  const ar = useLocale() === "ar";
  const t = useTranslations("Workspace");
  const { user, userId, logout } = useIdentity();
  const cache = useQueryClient();
  const notifications = useMutation({
    mutationFn: profileApi.notifications,
    onSuccess: async () => cache.invalidateQueries({ queryKey: keys.profile(userId) }),
  });
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Panel title={t("accountDetails")}>
        <p className="font-medium">{user.fullName}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          <bdi>{user.email}</bdi>
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          {ar
            ? "تعديل الاسم والبريد الإلكتروني مو متاح حاليًا."
            : "Name and email updates are currently unavailable."}
        </p>
      </Panel>
      <Panel title={t("notificationPreferences")}>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-primary"
            checked={user.notificationsEnabled ?? false}
            disabled={notifications.isPending || user.notificationsEnabled === undefined}
            onChange={(event) => notifications.mutate(event.currentTarget.checked)}
            aria-describedby="notification-preferences-description"
          />
          <span>
            <span className="block font-medium">{t("accountNotificationsEnabled")}</span>
            <span
              id="notification-preferences-description"
              className="mt-1 block text-muted-foreground"
            >
              {t("accountNotificationsDescription")}
            </span>
          </span>
        </label>
        {user.notificationsEnabled === undefined ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("notificationPreferenceUnavailable")}
          </p>
        ) : null}
        {notifications.isError ? <ErrorState error={notifications.error} /> : null}
      </Panel>
      <Panel title={ar ? "تغيير كلمة المرور" : "Change password"}>
        <ChangePasswordForm />
      </Panel>
      <details className="rounded-xl border border-destructive/20 p-4">
        <summary className="cursor-pointer text-sm font-medium text-destructive">
          {t("accountStatus")}
        </summary>
        <p className="my-4 text-sm text-muted-foreground">{t("deactivateAccountHint")}</p>
        <DeleteAction
          label={t("deactivateAccount")}
          title={t("deactivateAccountTitle")}
          description={t("deactivateAccountHint")}
          confirmLabel={t("deactivateAccount")}
          onDelete={async () => {
            await profileApi.deactivate();
            await logout();
          }}
        />
      </details>
    </div>
  );
}
export function ProfilePage() {
  const ar = useLocale() === "ar";
  return (
    <>
      <PageHeading
        title={ar ? "ملفك وتفضيلاتك" : "Your profile and preferences"}
        description={
          ar
            ? "احفظ تفضيلاتك والأماكن اللي تهمك عشان تقارن الخيارات."
            : "Save your preferences and important places to compare options."
        }
      />
      <div className="mb-6 max-w-3xl">
        <ProfileCompletionPanel />
      </div>
      <Tabs
        defaultValue="housing"
        className="gap-6"
      >
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1 sm:w-fit">
          <TabsTrigger
            value="housing"
            className="min-h-11"
          >
            <SlidersHorizontal />
            {ar ? "السكن" : "Housing"}
          </TabsTrigger>
          <TabsTrigger
            value="home"
            className="min-h-11"
          >
            <MapPin />
            {ar ? "المنزل" : "Home"}
          </TabsTrigger>
          <TabsTrigger
            value="account"
            className="min-h-11"
          >
            <UserRound />
            {ar ? "الحساب" : "Account"}
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="housing"
          className="max-w-3xl"
        >
          <HousingPanel />
        </TabsContent>
        <TabsContent
          value="home"
          className="max-w-3xl"
        >
          <HomePanel />
        </TabsContent>
        <TabsContent value="account">
          <AccountSettings />
        </TabsContent>
      </Tabs>
    </>
  );
}
