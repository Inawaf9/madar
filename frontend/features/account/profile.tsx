"use client";

import { useLocale, useTranslations } from "next-intl";
import { MapPin, SlidersHorizontal, UserRound } from "lucide-react";
import { ChangePasswordForm } from "@/features/auth/change-password-form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { profileApi } from "@/lib/api/account";
import { comparisonsApi } from "@/lib/api/comparisons";
import { useIdentity } from "@/features/account/identity";
import { DeleteAction } from "@/components/shared/delete-action";
import { Panel } from "@/components/shared/panel";
import { PageHeading } from "@/components/shared/page-heading";
import { ProfileCompletionPanel } from "./profile-completion";
import { HomePanel } from "./current-home-panel";
import { HousingPanel } from "./housing-preferences-panel";

function AccountSettings() {
  const ar = useLocale() === "ar";
  const t = useTranslations("Workspace");
  const { user, logout } = useIdentity();
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
      <Panel title={ar ? "تغيير كلمة المرور" : "Change password"}>
        <ChangePasswordForm />
      </Panel>
      <details className="rounded-xl border border-destructive/20 p-4">
        <summary className="cursor-pointer text-sm font-medium text-destructive">
          {ar ? "إدارة الحساب وحذفه" : "Account management and deletion"}
        </summary>
        <p className="my-4 text-sm text-muted-foreground">{t("deleteAccountHint")}</p>
        <DeleteAction
          label={t("deleteAccount")}
          onDelete={async () => {
            const comparisons = await comparisonsApi.get();
            for (const pair of comparisons)
              if (pair.id) await comparisonsApi.remove(pair.id);
            await profileApi.remove();
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
