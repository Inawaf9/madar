"use client";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
const Animation = dynamic(() => import("./madar-avatar-animation"), { ssr: false });
export function MadarAvatar({
  state = "idle",
  className,
  playing = true,
  variant = "default",
}: {
  playing?: boolean;
  state?: "idle" | "thinking";
  className?: string;
  variant?: "default" | "trigger";
}) {
  // The 1600px animation canvas includes transparent margins around a ~979px
  // circle. Enlarge that artwork, not the trigger, with room for its motion.
  return (
    <span
      aria-hidden="true"
      data-state={state}
      className={cn(
        "inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full [&_svg]:size-full",
        variant === "trigger" ? "bg-transparent" : "bg-secondary",
        className,
      )}
    >
      {variant === "trigger" ? (
        <span className="block size-full origin-center scale-125">
          <Animation
            state={state}
            playing={playing}
          />
        </span>
      ) : (
        <Animation
          state={state}
          playing={playing}
        />
      )}
    </span>
  );
}
