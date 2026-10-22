"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { MotionConfig } from "motion/react";
import type { ComponentProps } from "react";

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemeProvider>) {
  // Preserve the existing React 19 remount workaround: the server copy runs
  // before hydration; the client-rendered copy must not execute a second time.
  const scriptProps =
    typeof window === "undefined" ? undefined : { type: "application/json" as const };

  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      scriptProps={scriptProps}
      {...props}
    >
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </NextThemeProvider>
  );
}
