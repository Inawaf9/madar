import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export function PageContainer({
  as: Tag = "div",
  width = "public",
  className,
  ...props
}: ComponentPropsWithoutRef<"div"> & {
  as?: "div" | "main";
  width?: "public" | "dashboard";
}) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full min-w-0 px-4 sm:px-6 lg:px-8",
        width === "dashboard" ? "max-w-360" : "max-w-7xl",
        className,
      )}
      {...props}
    />
  );
}
