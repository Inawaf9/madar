"use client";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useIdentity } from "@/features/account/identity";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/errors";
import { Panel } from "@/components/shared/panel";
import { ErrorState } from "@/components/shared/error-state";
import { MadarLoader } from "@/components/branding/madar-loader";
const usersSchema = z.array(
  z.object({ id: z.number().int().positive(), fullName: z.string(), email: z.email() }),
);
export function AdminUsers() {
  const { userId } = useIdentity();
  const t = useTranslations("Auth");
  const query = useQuery({
    queryKey: ["admin-users", userId],
    retry: false,
    queryFn: async ({ signal }) => {
      const result = usersSchema.safeParse(await adminApi.users(signal));
      if (!result.success) throw new ApiError("Invalid administrative response", 502);
      return result.data;
    },
  });
  return (
    <Panel title={t("admin")}>
      {query.isPending ? (
        <MadarLoader variant="section" />
      ) : query.isError ? (
        <ErrorState
          error={query.error}
          retry={() => void query.refetch()}
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {query.data.map((user) => (
            <li key={user.id}>
              <p>{user.fullName}</p>
              <bdi className="text-sm text-muted-foreground">{user.email}</bdi>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
